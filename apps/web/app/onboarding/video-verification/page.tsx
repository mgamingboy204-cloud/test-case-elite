"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import { useSession } from "../../../lib/session";

type Status = "idle" | "loading" | "success" | "error";

type VerificationRequest = {
  id: string;
  status: "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  verificationLink?: string | null;
  linkExpiresAt?: string | null;
  createdAt?: string;
  completedAt?: string | null;
};

export default function VideoVerificationPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [hasJoinedCall, setHasJoinedCall] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    void loadStatus();
  }, []);

  useEffect(() => {
    if (request?.status !== "COMPLETED") return;
    const timer = setTimeout(async () => {
      const user = await refresh();
      if (user?.onboardingStep === "VIDEO_VERIFIED" || user?.paymentStatus === "NOT_STARTED") {
        router.replace("/onboarding/payment");
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [request?.status, refresh, router]);

  useEffect(() => {
    const shouldPoll =
      request?.status === "REQUESTED" || request?.status === "IN_PROGRESS";
    if (!shouldPoll) {
      setIsPolling(false);
      return;
    }
    setIsPolling(true);
    const interval = setInterval(() => {
      void loadStatus(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [request?.status]);

  async function loadStatus(silent = false) {
    if (!silent) {
      setStatus("loading");
      setMessage("");
    }
    try {
      const data = await apiFetch<{ request: VerificationRequest | null }>("/verification/status");
      setRequest(data.request ?? null);
      if (!silent) {
        setStatus("success");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to load verification status.");
    }
  }

  async function submitRequest() {
    setStatus("loading");
    setMessage("");
    try {
      const data = await apiFetch<{ request: VerificationRequest }>("/verification-requests", { method: "POST" });
      setRequest(data.request);
      setStatus("success");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit verification request.");
    }
  }

  const joinUrl = request?.verificationLink ?? "";
  const derivedStatus = useMemo(() => {
    if (!request) return "NOT_STARTED";
    if (request.status === "COMPLETED") return "APPROVED";
    if (request.status === "REJECTED") return "REJECTED";
    if (request.status === "IN_PROGRESS") {
      return joinUrl && hasJoinedCall ? "REVIEWING" : "IN_CALL";
    }
    return "REQUESTED";
  }, [request, joinUrl, hasJoinedCall]);

  const hasRequest = Boolean(request);
  const linkReady = Boolean(joinUrl);
  const statusLabel = derivedStatus;
  const primaryAction = !hasRequest
    ? { label: "Start verification", onClick: submitRequest }
    : derivedStatus === "APPROVED"
      ? { label: "Continue to payment", onClick: () => router.push("/onboarding/payment") }
      : derivedStatus === "REJECTED"
        ? { label: "Contact support", onClick: () => router.push("/support") }
        : derivedStatus === "IN_CALL" && linkReady
          ? {
              label: hasJoinedCall ? "Return to call" : "Join call",
              onClick: () => {
                window.open(joinUrl, "_blank", "noopener,noreferrer");
                setHasJoinedCall(true);
              }
            }
          : { label: "Refresh status", onClick: () => loadStatus() };

  const steps = [
    { key: "REQUESTED", label: "Requested", copy: "We received your request." },
    { key: "IN_CALL", label: "In call", copy: "Join your concierge call." },
    { key: "REVIEWING", label: "Reviewing", copy: "We’re finalizing your review." },
    { key: "APPROVED", label: "Approved", copy: "Payment is now unlocked." }
  ];
  const activeStepIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === (derivedStatus === "REJECTED" ? "REVIEWING" : derivedStatus))
  );

  return (
    <div className="verification-shell">
      <div className="verification-header">
        <span className="mobile-gate-step">Step 2 of 3</span>
        <h2>Quick identity check</h2>
        <p className="text-muted">A short private call with our team. We never store recordings.</p>
      </div>
      <section className="card verification-card">
        <div className="verification-card__intro">
          <span className="verification-pill">Video verification</span>
          <h3>Quick identity check</h3>
          <p className="card-subtitle">
            A short private call with our team. We never store recordings.
          </p>
        </div>

        <div className="verification-icon-list">
          <div className="verification-icon-row">
            <span>⏱</span>
            <div>
              <strong>2–3 minute concierge call</strong>
              <p className="text-muted">Quick and guided by our verification team.</p>
            </div>
          </div>
          <div className="verification-icon-row">
            <span>🪪</span>
            <div>
              <strong>Have a government-issued ID nearby</strong>
              <p className="text-muted">We’ll verify identity in real time.</p>
            </div>
          </div>
          <div className="verification-icon-row">
            <span>🔓</span>
            <div>
              <strong>Approval unlocks payment</strong>
              <p className="text-muted">Continue immediately once approved.</p>
            </div>
          </div>
        </div>

        <button className="primary-confirm" onClick={primaryAction.onClick} disabled={status === "loading"}>
          {status === "loading" ? "Updating..." : primaryAction.label}
        </button>
        {derivedStatus === "APPROVED" ? (
          <p className="message success">Approved — payment is now unlocked.</p>
        ) : null}
        {message ? <p className={`message ${status}`}>{message}</p> : null}
        {linkReady && derivedStatus === "IN_CALL" ? (
          <p className="helper-text">Opening Google Meet in a new tab. Return here to refresh status.</p>
        ) : null}
      </section>

      <section className="card verification-card">
        <div className="status-card">
          <div>
            <h3>Live status</h3>
            <p className="card-subtitle">We’ll update this as soon as your reviewer completes the call.</p>
          </div>
          <span className={`status-pill status-pill--${statusLabel.toLowerCase().replace("_", "-")}`}>
            {statusLabel.replace("_", " ")}
          </span>
        </div>

        {status === "loading" && !hasRequest ? (
          <div className="status-skeleton">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        ) : null}
        {!hasRequest && status !== "loading" ? (
          <p className="card-subtitle">Start verification to schedule your call.</p>
        ) : null}

        <div className="status-stepper">
          {steps.map((step, index) => {
            const isComplete = index < activeStepIndex;
            const isActive = index === activeStepIndex;
            return (
              <div key={step.key} className={`status-step ${isComplete ? "complete" : ""} ${isActive ? "active" : ""}`}>
                <span className="status-dot" />
                <div>
                  <strong>{step.label}</strong>
                  <p className="text-muted">{step.copy}</p>
                </div>
              </div>
            );
          })}
        </div>

        {isPolling ? <p className="helper-text">Refreshing automatically every few seconds.</p> : null}
        {status === "error" ? (
          <div className="message error">
            <strong>We couldn’t refresh your status.</strong>
            <span>Tap the button above to retry.</span>
          </div>
        ) : null}
      </section>
    </div>
  );
}
