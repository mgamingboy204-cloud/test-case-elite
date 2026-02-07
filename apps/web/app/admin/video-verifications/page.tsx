"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../lib/api";
import { queryKeys } from "../../../lib/queryKeys";

type Status = "idle" | "loading" | "success" | "error";

type VerificationRequest = {
  id: string;
  status: "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
  meetUrl?: string | null;
  linkExpiresAt?: string | null;
  createdAt?: string;
  user?: { phone?: string; email?: string | null };
};

type VerificationResponse = { requests: VerificationRequest[] };

export default function AdminVideoVerificationsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [links, setLinks] = useState<Record<string, string>>({});

  const requestsQuery = useQuery({
    queryKey: queryKeys.adminVideoQueue(filter),
    queryFn: () => {
      const query = filter && filter !== "ALL" ? `?status=${filter}` : "";
      return apiFetch<VerificationResponse>(`/admin/verification-requests${query}`);
    },
    staleTime: 5000,
    refetchInterval: 4000
  });

  const startMutation = useMutation({
    mutationFn: ({ id, meetUrl }: { id: string; meetUrl: string }) =>
      apiFetch(`/admin/verification-requests/${id}/start`, {
        method: "POST",
        body: JSON.stringify({ meetUrl })
      }),
    onSuccess: () => {
      setStatus("success");
      setMessage("Verification link sent.");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminVideoQueue(filter) });
      queryClient.invalidateQueries({ queryKey: queryKeys.adminQueues });
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send verification link.");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: "approve" | "reject"; reason?: string }) =>
      apiFetch(`/admin/verification-requests/${id}/${action}`, {
        method: "POST",
        body: JSON.stringify(reason ? { reason } : {})
      }),
    onSuccess: (_data, variables) => {
      setStatus("success");
      setMessage(`Request ${variables.action}d.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminVideoQueue(filter) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userVerificationStatus });
      queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to update request.");
    }
  });

  function loadRequests() {
    setStatus("loading");
    setMessage("Loading verification requests...");
    void requestsQuery.refetch();
  }

  function startRequest(id: string) {
    setStatus("loading");
    setMessage("Sending link to applicant...");
    startMutation.mutate({ id, meetUrl: (links[id] ?? "").trim() });
  }

  function updateRequest(id: string, action: "approve" | "reject") {
    setStatus("loading");
    setMessage(`${action === "approve" ? "Approving" : "Rejecting"} request...`);
    const payload =
      action === "reject"
        ? { reason: window.prompt("Reason for rejection?")?.trim() || "" }
        : { reason: undefined };
    if (action === "reject" && !payload.reason) {
      setStatus("error");
      setMessage("Rejection reason is required.");
      return;
    }
    updateMutation.mutate({ id, action, reason: payload.reason });
  }

  const filteredRequests = useMemo(() => {
    const requests = requestsQuery.data?.requests ?? [];
    if (filter === "ALL") return requests;
    return requests.filter((request) => request.status === filter);
  }, [filter, requestsQuery.data?.requests]);

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
        <button onClick={loadRequests} disabled={status === "loading"}>
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
                      <button
                        onClick={() => startRequest(request.id)}
                        disabled={status === "loading" || !(links[request.id] ?? "").trim()}
                      >
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
                      <button
                        className="secondary"
                        onClick={() => updateRequest(request.id, "approve")}
                        disabled={status === "loading"}
                      >
                        Approve
                      </button>
                      <button
                        className="secondary"
                        onClick={() => updateRequest(request.id, "reject")}
                        disabled={status === "loading"}
                      >
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
