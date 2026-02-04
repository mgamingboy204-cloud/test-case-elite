"use client";

import { useState } from "react";
import { apiFetch } from "../../../lib/api";

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadRefunds() {
    setLoading(true);
    setMessage("Loading refund requests...");
    try {
      const data = await apiFetch("/admin/refunds");
      setRefunds(data.refunds ?? []);
      setMessage("Refund requests loaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load refunds.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(id: string, action: "approve" | "deny") {
    setLoading(true);
    setMessage(`${action === "approve" ? "Approving" : "Denying"} refund...`);
    try {
      await apiFetch(`/admin/refunds/${id}/${action}`, { method: "POST" });
      setMessage(`Refund ${action}d.`);
      await loadRefunds();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update refund.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <h2>Refund Requests</h2>
      <button onClick={loadRefunds} disabled={loading}>
        {loading ? "Loading..." : "Load Refunds"}
      </button>
      {message ? <p className="message">{message}</p> : null}
      <ul className="list">
        {refunds.map((refund) => (
          <li key={refund.id} className="list-item">
            <div>
              <strong>{refund.user?.phone ?? "Unknown"}</strong>
              <p className="card-subtitle">{refund.status}</p>
            </div>
            <div className="grid two-column">
              <button onClick={() => decide(refund.id, "approve")} disabled={loading}>
                Approve
              </button>
              <button className="secondary" onClick={() => decide(refund.id, "deny")} disabled={loading}>
                Deny
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
