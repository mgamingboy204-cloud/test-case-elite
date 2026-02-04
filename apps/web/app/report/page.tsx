"use client";

import { useState } from "react";
import { apiFetch } from "../../lib/api";
import RouteGuard from "../components/RouteGuard";

type Status = "idle" | "loading" | "success" | "error";

export default function ReportPage() {
  const [reportedUserId, setReportedUserId] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submitReport() {
    setStatus("loading");
    setMessage("Submitting report...");
    try {
      await apiFetch("/reports", {
        method: "POST",
        body: JSON.stringify({ reportedUserId, reason, details })
      });
      setStatus("success");
      setMessage("Report submitted. Our trust team will follow up.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit report.");
    }
  }

  return (
    <RouteGuard>
      <div className="card">
        <div>
          <h2>Report User</h2>
          <p className="card-subtitle">Let us know if anything feels off. We respond quickly.</p>
        </div>
        <div className="form">
          <div className="field">
            <label htmlFor="report-user">Reported User ID</label>
            <input
              id="report-user"
              placeholder="Reported User ID"
              value={reportedUserId}
              onChange={(e) => setReportedUserId(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="report-reason">Reason</label>
            <input
              id="report-reason"
              placeholder="Reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="report-details">Details</label>
            <textarea
              id="report-details"
              placeholder="Add any supporting details."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
          </div>
          <button onClick={submitReport} disabled={status === "loading"}>
            {status === "loading" ? "Submitting..." : "Submit Report"}
          </button>
          {message ? <p className={`message ${status}`}>{message}</p> : null}
        </div>
      </div>
    </RouteGuard>
  );
}
