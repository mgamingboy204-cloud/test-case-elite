"use client";

import { useState } from "react";
import { apiFetch } from "../../../lib/api";
import RouteGuard from "../../components/RouteGuard";

type Status = "idle" | "loading" | "success" | "error";

export default function RequestsPage() {
  const [incoming, setIncoming] = useState<any[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function loadIncoming() {
    setStatus("loading");
    setMessage("Loading incoming likes...");
    try {
      const data = await apiFetch<{ incoming: any[] }>("/likes/incoming");
      setIncoming(data.incoming ?? []);
      setStatus("success");
      setMessage(data.incoming?.length ? "Review your incoming likes." : "No new requests yet.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to load requests.");
    }
  }

  async function respond(toUserId: string, type: "LIKE" | "PASS") {
    setStatus("loading");
    setMessage(type === "LIKE" ? "Approving..." : "Rejecting...");
    try {
      await apiFetch("/likes", {
        method: "POST",
        body: JSON.stringify({ toUserId, type })
      });
      setStatus("success");
      setMessage(type === "LIKE" ? "Match approved!" : "Request rejected.");
      await loadIncoming();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to respond.");
    }
  }

  return (
    <RouteGuard>
      <div className="card app-page">
        <div>
          <h2>Likes</h2>
          <p className="card-subtitle">People who liked you. Approve to create a match.</p>
        </div>
        <button onClick={loadIncoming} disabled={status === "loading"}>
          {status === "loading" ? "Loading..." : "Load Requests"}
        </button>
        {message ? <p className={`message ${status}`}>{message}</p> : null}
        <ul className="list">
          {incoming.map((like) => (
            <li key={like.id} className="list-item">
              <div>
                <strong>{like.fromUser?.profile?.name ?? "New admirer"}</strong>
                <p className="card-subtitle">
                  {like.fromUser?.profile?.city ?? "Unknown city"} • {like.fromUser?.profile?.profession ?? "—"}
                </p>
              </div>
              <div className="inline-actions">
                <button className="secondary" onClick={() => respond(like.fromUserId, "PASS")}>
                  Reject
                </button>
                <button onClick={() => respond(like.fromUserId, "LIKE")}>Approve</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </RouteGuard>
  );
}
