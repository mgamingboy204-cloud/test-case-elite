"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import { useSession } from "../../../lib/session";

type Status = "idle" | "loading" | "success" | "error";

export default function PaymentPage() {
  const { refresh } = useSession();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    void loadPayment();
  }, []);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  async function loadPayment() {
    try {
      const data = await apiFetch<{ paymentStatus?: string }>("/payments/me");
      setPaymentStatus(data.paymentStatus ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load payment status.");
      setStatus("error");
    }
  }

  async function startPayment() {
    setStatus("loading");
    setMessage("Starting payment...");
    try {
      const data = await apiFetch<{ paymentStatus: string }>("/payments/mock/start", { method: "POST" });
      setPaymentStatus(data.paymentStatus);
      setStatus("success");
      setMessage("Payment initiated. Confirm to continue.");
      await refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to start payment.");
    } finally {
      setConfirming(false);
    }
  }

  async function confirmPayment() {
    setStatus("loading");
    setMessage("Confirming payment...");
    try {
      const data = await apiFetch<{ paymentStatus: string }>("/payments/mock/confirm", { method: "POST" });
      setPaymentStatus(data.paymentStatus);
      setStatus("success");
      setMessage("Payment confirmed. Continue to profile setup.");
      await refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to confirm payment.");
    }
  }

  const resolvedStatus = paymentStatus ?? "NOT_STARTED";
  const primaryAction =
    resolvedStatus === "NOT_STARTED"
      ? isMobile
        ? {
            label: "Proceed to payment",
            onClick: () => setConfirming(true)
          }
        : { label: "Start payment", onClick: startPayment }
      : resolvedStatus === "STARTED"
        ? { label: "Confirm payment", onClick: confirmPayment }
        : null;

  return (
    <div className="payment-shell">
      <div className="mobile-gate-header">
        <span className="mobile-gate-step">Step 3 of 3</span>
        <h2>Membership payment</h2>
        <p className="text-muted">Confirm to unlock profile setup and introductions.</p>
      </div>
      <section className="card payment-card">
        <span className="verification-pill">Membership payment</span>
        <h2>Unlock Elite Match</h2>
        <p className="card-subtitle">Complete your payment to begin profile setup and introductions.</p>
        <ul className="expectation-list">
          <li>Priority access to curated matches.</li>
          <li>Concierge verification and support.</li>
          <li>Exclusive weekly introductions.</li>
        </ul>
        <div className="payment-status">
          <span>Current status</span>
          <strong>{resolvedStatus}</strong>
        </div>
        {primaryAction ? (
          <>
            <button onClick={primaryAction.onClick} disabled={status === "loading"}>
              {status === "loading" ? "Processing..." : primaryAction.label}
            </button>
            {isMobile && confirming && resolvedStatus === "NOT_STARTED" ? (
              <button onClick={startPayment} disabled={status === "loading"} className="primary-confirm">
                Confirm &amp; proceed
              </button>
            ) : null}
          </>
        ) : (
          <div className="card muted">
            <p>Payment complete. Continue to profile setup.</p>
          </div>
        )}
        {message ? <p className={`message ${status}`}>{message}</p> : null}
      </section>
    </div>
  );
}
