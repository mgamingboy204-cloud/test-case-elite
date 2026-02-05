"use client";

import { useEffect, useRef, useState } from "react";
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

const BASE_POLL_INTERVAL_MS = 7000;
const MAX_POLL_INTERVAL_MS = 60000;

export default function VideoVerificationPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollDelay = useRef(BASE_POLL_INTERVAL_MS);

  useEffect(() => {
    void loadStatus();
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!request || ["COMPLETED", "REJECTED"].includes(request.status)) {
      return;
    }
    schedulePoll();
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, [request]);

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

  function schedulePoll() {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    pollTimer.current = setTimeout(() => {
      void loadStatus(true);
    }, pollDelay.current);
  }

  async function loadStatus(silent = false) {
    if (!silent) {
      setStatus("loading");
      setMessage("");
    }
    try {
      const data = await apiFetch<{ request: VerificationRequest | null }>("/verification/status");
      setRequest(data.request ?? null);
      pollDelay.current = BASE_POLL_INTERVAL_MS;
      if (!silent) {
        setStatus("success");
      }
      if (data.request && !["COMPLETED", "REJECTED"].includes(data.request.status)) {
        schedulePoll();
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to load verification status.");
      pollDelay.current = Math.min(pollDelay.current * 2, MAX_POLL_INTERVAL_MS);
      schedulePoll();
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

  return (
    <div className="verification-shell">
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

        {!hasRequest ? (
          <button onClick={submitRequest} disabled={status === "loading"}>
            {status === "loading" ? "Submitting..." : "Request verification"}
          </button>
        ) : null}
        {message ? <p className={`message ${status}`}>{message}</p> : null}
      </section>

      <section className="card verification-card">
        <div className="status-card">
          <h3>Live status</h3>
          <p className="card-subtitle">We’ll update this as soon as your reviewer joins.</p>
          <div className="status-pill">
            Status: <strong>{request?.status ?? (status === "success" ? "REQUESTED" : "NOT_STARTED")}</strong>
          </div>
        </div>

        {isRequested ? (
          <div className="card muted">
            <h4>Requested</h4>
            <p className="card-subtitle">We’ll connect you within a few minutes. Please keep this page open.</p>
          </div>
        ) : null}
        {isInProgress && !linkReady ? (
          <div className="card muted">
            <h4>Waiting for link</h4>
            <p className="card-subtitle">Your verifier is preparing the call link.</p>
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
