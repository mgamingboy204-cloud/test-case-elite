"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../lib/api";
import { queryKeys } from "../../../lib/queryKeys";
import { useSession } from "../../../lib/session";

type Status = "idle" | "loading" | "success" | "error";

type VerificationStatus = "NOT_REQUESTED" | "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";

type VerificationStatusResponse = {
  status: VerificationStatus;
  meetUrl?: string | null;
};

type VerificationRequestResponse = {
  request: { status: VerificationStatus; meetUrl?: string | null; verificationLink?: string | null };
};

export default function VideoVerificationPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [hasJoinedCall, setHasJoinedCall] = useState(false);

  const statusQuery = useQuery({
    queryKey: queryKeys.userVerificationStatus,
    queryFn: () => apiFetch<VerificationStatusResponse>("/me/verification-status"),
    staleTime: 5000,
    refetchInterval: (data) => {
      const shouldPoll = data?.status === "REQUESTED" || data?.status === "IN_PROGRESS";
      return shouldPoll ? 7000 : false;
    }
  });

  const requestMutation = useMutation({
    mutationFn: () => apiFetch<VerificationRequestResponse>("/verification-requests", { method: "POST" }),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.userVerificationStatus, {
        status: data.request.status,
        meetUrl: data.request.meetUrl ?? data.request.verificationLink ?? null
      });
      queryClient.invalidateQueries({ queryKey: ["adminVideoQueue"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
      queryClient.invalidateQueries({ queryKey: queryKeys.profile("me") });
      queryClient.invalidateQueries({ queryKey: queryKeys.uploads });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQueues });
      setStatus("success");
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit verification request.");
    }
  });

  useEffect(() => {
    if (statusQuery.isLoading) {
      setStatus("loading");
      return;
    }
    if (statusQuery.isError) {
      setStatus("error");
      setMessage(statusQuery.error instanceof Error ? statusQuery.error.message : "Unable to load verification status.");
      return;
    }
    if (statusQuery.isSuccess) {
      setStatus("success");
    }
  }, [statusQuery.isLoading, statusQuery.isError, statusQuery.isSuccess, statusQuery.error]);

  useEffect(() => {
    if (statusQuery.data?.status !== "COMPLETED") return;
    const timer = setTimeout(async () => {
      const user = await refresh();
      if (user?.onboardingStep === "VIDEO_VERIFIED" || user?.paymentStatus === "NOT_STARTED") {
        router.replace("/onboarding/payment");
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [statusQuery.data?.status, refresh, router]);

  function loadStatus() {
    setStatus("loading");
    setMessage("");
    void statusQuery.refetch();
  }

  function submitRequest() {
    setStatus("loading");
    setMessage("");
    requestMutation.mutate();
  }

  const verificationStatus = statusQuery.data ?? null;
  const joinUrl = verificationStatus?.meetUrl ?? "";
  const derivedStatus = useMemo(() => {
    if (!verificationStatus) return "NOT_REQUESTED";
    return verificationStatus.status;
  }, [verificationStatus]);

  const hasRequest = derivedStatus !== "NOT_REQUESTED";
  const linkReady = Boolean(joinUrl);
  const statusLabel =
    derivedStatus === "IN_PROGRESS" && linkReady ? (hasJoinedCall ? "IN_CALL" : "SCHEDULED") : derivedStatus;
  const primaryAction = !hasRequest
    ? { label: "Start verification", onClick: submitRequest }
    : derivedStatus === "COMPLETED"
      ? { label: "Continue to payment", onClick: () => router.push("/onboarding/payment") }
      : derivedStatus === "REJECTED"
        ? { label: "Contact support", onClick: () => router.push("/support") }
        : derivedStatus === "IN_PROGRESS" && linkReady
          ? {
              label: "Join verification call",
              onClick: () => {
                window.open(joinUrl, "_blank", "noopener,noreferrer");
                setHasJoinedCall(true);
              }
            }
          : { label: "Refresh status", onClick: loadStatus };
  const showSecondaryRefresh = Boolean(hasRequest && linkReady && derivedStatus === "IN_PROGRESS");

  const steps = [
    { key: "REQUESTED", label: "Requested", copy: "We received your request." },
    { key: "IN_PROGRESS", label: "Scheduled", copy: "A verification call is ready." },
    { key: "COMPLETED", label: "Approved", copy: "Payment is now unlocked." }
  ];
  const activeStepIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === (derivedStatus === "REJECTED" ? "REQUESTED" : derivedStatus))
  );

  const isPolling = statusQuery.isFetching && (derivedStatus === "REQUESTED" || derivedStatus === "IN_PROGRESS");

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
          <p className="card-subtitle">A short private call with our team. We never store recordings.</p>
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
      </section>

      <div className="verification-cta">
        <button className="primary-confirm" onClick={primaryAction.onClick} disabled={status === "loading"}>
          {status === "loading" ? "Updating..." : primaryAction.label}
        </button>
        {showSecondaryRefresh ? (
          <button className="text-button" type="button" onClick={loadStatus}>
            Refresh status
          </button>
        ) : null}
        {derivedStatus === "COMPLETED" ? <p className="message success">Approved — payment is now unlocked.</p> : null}
        {message ? <p className={`message ${status}`}>{message}</p> : null}
        {linkReady && derivedStatus === "IN_PROGRESS" ? (
          <p className="helper-text">Join the call in a new tab, then return here for status updates.</p>
        ) : null}
      </div>

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
