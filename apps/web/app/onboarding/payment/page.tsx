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

  useEffect(() => {
    void loadPayment();
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

  return (
    <div className="card">
      <h2>Mock Payment</h2>
      <p className="card-subtitle">Complete your payment to unlock profile setup.</p>
      <div className="form">
        <p>
          Current status: <strong>{paymentStatus ?? "NOT_STARTED"}</strong>
        </p>
        <div className="inline-actions">
          <button onClick={startPayment} disabled={status === "loading"}>
            Start payment
          </button>
          <button className="secondary" onClick={confirmPayment} disabled={status === "loading"}>
            Confirm payment
          </button>
        </div>
        {message ? <p className={`message ${status}`}>{message}</p> : null}
      </div>
    </div>
  );
}
