"use client";

import { useEffect, useState } from "react";
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
    }, 500);
    return () => clearTimeout(timer);
  }, [request?.status, refresh, router]);

  async function loadStatus() {
    setStatus("loading");
    setMessage("");
    try {
      const data = await apiFetch<{ request: VerificationRequest | null }>("/verification/status");
      setRequest(data.request ?? null);
      setStatus("success");
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

  const hasRequest = Boolean(request);
  const isRequested = request?.status === "REQUESTED";
  const isInProgress = request?.status === "IN_PROGRESS";
  const isApproved = request?.status === "COMPLETED";
  const isRejected = request?.status === "REJECTED";
  const linkReady = Boolean(request?.verificationLink);
  const statusLabel = request?.status ?? "NOT_STARTED";
  const primaryAction = !hasRequest
    ? { label: "Start verification", onClick: submitRequest }
    : isApproved
      ? { label: "Continue", onClick: () => router.push("/onboarding/payment") }
      : { label: "Refresh status", onClick: loadStatus };

  return (
    <div className="verification-shell">
      <div className="mobile-gate-header">
        <span className="mobile-gate-step">Step 2 of 3</span>
        <h2>Video verification</h2>
        <p className="text-muted">We’re reviewing in the order requests are received.</p>
      </div>
      <section className="card verification-card">
        <div>
          <span className="verification-pill">Video Verification</span>
          <h2>Quick identity check</h2>
          <p className="card-subtitle">
            A short, private call with our team. We never store recordings.
          </p>
        </div>

        <ul className="expectation-list">
          <li>2–3 minute concierge call.</li>
          <li>Have a government-issued ID nearby.</li>
          <li>Approval unlocks the payment step.</li>
        </ul>

        <button onClick={primaryAction.onClick} disabled={status === "loading"}>
          {status === "loading" ? "Updating..." : primaryAction.label}
        </button>
        {message ? <p className={`message ${status}`}>{message}</p> : null}
      </section>

      <section className="card verification-card">
        <div className="status-card">
          <h3>Live status</h3>
          <p className="card-subtitle">We’ll update this as soon as your reviewer joins.</p>
          <div className="status-pill">
            Status: <strong>{statusLabel}</strong>
          </div>
        </div>

        {isRequested ? (
          <div className="card muted">
            <h4>Requested</h4>
            <p className="card-subtitle">We’re reviewing. Refresh here to see updates.</p>
          </div>
        ) : null}
        {isInProgress && !linkReady ? (
          <div className="card muted">
            <h4>Waiting for link</h4>
            <p className="card-subtitle">We’re reviewing and preparing your call link.</p>
          </div>
        ) : null}
        {isInProgress && linkReady ? (
          <div className="card muted">
            <h4>Ready to join</h4>
            <p className="card-subtitle">Click below to join the secure verification call.</p>
            <button
              onClick={() => window.open(request?.verificationLink ?? "#", "_blank", "noopener,noreferrer")}
              type="button"
            >
              Join Google Meet
            </button>
          </div>
        ) : null}
        {isApproved ? (
          <div className="card muted">
            <h4>Approved</h4>
            <p className="card-subtitle">Verification successful. Continue to payment.</p>
            <button onClick={() => router.push("/onboarding/payment")} type="button">
              Continue to payment
            </button>
          </div>
        ) : null}
        {isRejected ? (
          <div className="card muted">
            <h4>Needs retry</h4>
            <p className="card-subtitle">Verification could not be completed. Request another review.</p>
            <button onClick={submitRequest} type="button">
              Request another review
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
