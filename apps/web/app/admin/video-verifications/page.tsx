"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../../lib/api";

type Status = "idle" | "loading" | "success" | "error";

type VerificationRequest = {
  id: string;
  status: "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  meetUrl?: string | null;
  linkExpiresAt?: string | null;
  createdAt?: string;
  user?: { phone?: string; email?: string | null };
};

export default function AdminVideoVerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [links, setLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    void loadRequests(filter);
  }, [filter]);

  async function loadRequests(statusFilter?: string, silent = false) {
    if (!silent) {
      setStatus("loading");
      setMessage("Loading verification requests...");
    }
    try {
      const query = statusFilter && statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const data = await apiFetch<{ requests: VerificationRequest[] }>(`/admin/verification-requests${query}`);
      setRequests(data.requests ?? []);
      if (!silent) {
        setStatus("success");
        setMessage("");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to load verification requests.");
    }
  }

  async function startRequest(id: string) {
    setStatus("loading");
    setMessage("Sending link to applicant...");
    try {
      await apiFetch(`/admin/verification-requests/${id}/start`, {
        method: "POST",
        body: JSON.stringify({ meetUrl: (links[id] ?? "").trim() })
      });
      await loadRequests(filter);
      setStatus("success");
      setMessage("Verification link sent.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send verification link.");
    }
  }

  async function updateRequest(id: string, action: "approve" | "reject") {
    setStatus("loading");
    setMessage(`${action === "approve" ? "Approving" : "Rejecting"} request...`);
    try {
      const payload =
        action === "reject"
          ? { reason: window.prompt("Reason for rejection?")?.trim() || "" }
          : {};
      if (action === "reject" && !payload.reason) {
        setStatus("error");
        setMessage("Rejection reason is required.");
        return;
      }
      await apiFetch(`/admin/verification-requests/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      await loadRequests(filter);
      setStatus("success");
      setMessage(`Request ${action}d.`);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to update request.");
    }
  }

  const filteredRequests = useMemo(() => {
    if (filter === "ALL") return requests;
    return requests.filter((request) => request.status === filter);
  }, [filter, requests]);

  return (
    <div className="card">
      <h2>Verification Concierge Queue</h2>
      <p className="card-subtitle">Create a Google Meet link and paste it below to invite the applicant.</p>
      <div className="form">
        <label className="field">
          Status filter
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="ALL">All</option>
            <option value="REQUESTED">Requested</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </label>
        <button onClick={() => loadRequests(filter)} disabled={status === "loading"}>
          {status === "loading" ? "Loading..." : "Refresh"}
        </button>
      </div>
      {message ? <p className={`message ${status}`}>{message}</p> : null}
      {filteredRequests.length ? (
        <ul className="list">
          {filteredRequests.map((request) => {
            const isRequested = request.status === "REQUESTED";
            const isInProgress = request.status === "IN_PROGRESS";
            const isFinal = request.status === "COMPLETED" || request.status === "REJECTED";
            return (
              <li key={request.id} className="list-item">
                <div>
                  <strong>{request.user?.phone ?? "Unknown user"}</strong>
                  <p className="card-subtitle">Status: {request.status}</p>
                  {request.user?.email ? <p className="card-subtitle">{request.user.email}</p> : null}
                </div>
                <div className="form">
                  {isRequested ? (
                    <>
                      <label className="field">
                        Google Meet link
                        <input
                          placeholder="https://meet.google.com/abc-defg-hij"
                          value={links[request.id] ?? ""}
                          onChange={(event) => setLinks((prev) => ({ ...prev, [request.id]: event.target.value }))}
                        />
                      </label>
                      <button onClick={() => startRequest(request.id)} disabled={status === "loading" || !(links[request.id] ?? "").trim()}>
                        Send link
                      </button>
                    </>
                  ) : null}
                  {isInProgress ? (
                    <div className="card muted">
                      <p>Link sent. Awaiting completion.</p>
                    </div>
                  ) : null}
                  {isFinal ? (
                    <div className="card muted">
                      <p>Decision recorded.</p>
                    </div>
                  ) : null}
                  {isInProgress ? (
                    <div className="grid two-column">
                      <button className="secondary" onClick={() => updateRequest(request.id, "approve")} disabled={status === "loading"}>
                        Approve
                      </button>
                      <button className="secondary" onClick={() => updateRequest(request.id, "reject")} disabled={status === "loading"}>
                        Reject
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="card-subtitle">No verification requests found.</p>
      )}
    </div>
  );
}
