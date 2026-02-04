"use client";

import { useState } from "react";
import { apiFetch } from "../../lib/api";
import RouteGuard from "../components/RouteGuard";

type Status = "idle" | "loading" | "success" | "error";

export default function RefundsPage() {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [refunds, setRefunds] = useState<any[]>([]);

  async function requestRefund() {
    setStatus("loading");
    setMessage("Submitting refund request...");
    try {
      const data = await apiFetch<{ eligibility: { eligible: boolean; reasons: string[] } }>(
        "/refunds/request",
        {
          method: "POST",
          body: JSON.stringify({ reason })
        }
      );
      setStatus("success");
      setMessage(
        data.eligibility?.eligible
          ? "Refund request submitted."
          : `Ineligible: ${(data.eligibility?.reasons ?? []).join(", ")}`
      );
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to request refund.");
    }
  }

  async function loadRefunds() {
    setStatus("loading");
    setMessage("Loading refund history...");
    try {
      const data = await apiFetch<{ refunds: any[] }>("/refunds/me");
      setRefunds(data.refunds ?? []);
      setStatus("success");
      setMessage("Refund history updated.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to load refunds.");
    }
  }

  return (
    <RouteGuard>
      <div className="card">
        <div>
          <h2>Refunds</h2>
          <p className="card-subtitle">
            Eligibility: approved + verified, minimum likes, no successful engagement, 90+ days.
          </p>
        </div>
        <div className="form">
          <div className="field">
            <label htmlFor="refund-reason">Reason (optional)</label>
            <textarea
              id="refund-reason"
              placeholder="Tell us what went wrong."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="grid two-column">
            <button onClick={requestRefund} disabled={status === "loading"}>
              {status === "loading" ? "Submitting..." : "Request Refund"}
            </button>
            <button className="secondary" onClick={loadRefunds} disabled={status === "loading"}>
              Load My Refunds
            </button>
          </div>
          {message ? <p className={`message ${status}`}>{message}</p> : null}
        </div>
        {refunds.length ? (
          <ul className="list">
            {refunds.map((refund) => (
              <li key={refund.id} className="list-item">
                <div>
                  <strong>{refund.status}</strong>
                  <p className="card-subtitle">Requested {new Date(refund.requestedAt).toLocaleDateString()}</p>
                </div>
                <span>{refund.reason || "No reason provided"}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </RouteGuard>
  );
}
