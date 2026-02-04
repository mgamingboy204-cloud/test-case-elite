"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../../lib/api";

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
    <div className="grid two-column">
      <section className="card">
        <h2>Concierge Verification</h2>
        <p className="card-subtitle">A dedicated verifier will join you on a secure Google Meet call.</p>
        <div className="form">
          {!hasRequest ? (
            <button onClick={submitRequest} disabled={status === "loading"}>
              {status === "loading" ? "Submitting..." : "Submit for Verification"}
            </button>
          ) : null}
          {message ? <p className={`message ${status}`}>{message}</p> : null}
          {isRequested ? (
            <div className="card muted">
              <p>Thank you for submitting your verification request.</p>
              <p className="card-subtitle">Our verification team will reach out within 2–5 minutes. Please keep this page open.</p>
            </div>
          ) : null}
          {isInProgress && !linkReady ? (
            <div className="card muted">
              <p>Your verifier is preparing the call.</p>
              <p className="card-subtitle">We will unlock the join button as soon as the secure link is ready.</p>
            </div>
          ) : null}
          {isInProgress && linkReady ? (
            <div className="card muted">
              <p>Your verifier is ready.</p>
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
              <p>Verification successful. You may continue.</p>
              <button onClick={() => router.push("/onboarding/payment")} type="button">
                Continue to payment
              </button>
            </div>
          ) : null}
          {isRejected ? (
            <div className="card muted">
              <p>Verification could not be completed at this time.</p>
              <button onClick={submitRequest} type="button">
                Request another review
              </button>
            </div>
          ) : null}
        </div>
      </section>
      <section className="card">
        <h3>What to expect</h3>
        <div className="card muted">
          <p>Your verifier will confirm your identity and guide you through a short, professional call.</p>
          <p className="card-subtitle">No recordings are stored. You can refresh this page at any time without losing progress.</p>
        </div>
        {hasRequest ? (
          <div className="card muted">
            <p>Status: <strong>{request?.status}</strong></p>
          </div>
        ) : (
          <div className="card muted">
            <p>Submit your request to begin concierge verification.</p>
          </div>
        )}
      </section>
    </div>
  );
}
