"use client";

import { useState } from "react";
import { apiFetch } from "../../lib/api";
import RouteGuard from "../components/RouteGuard";
import AppShell from "../components/AppShell";

type Status = "idle" | "loading" | "success" | "error";

export default function LikesPage() {
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
    <RouteGuard requireActive>
      <AppShell>
        <div className="stack-page">
          <div className="page-header">
            <div>
              <h2>Likes</h2>
              <p className="card-subtitle">People who liked you. Approve to create a match.</p>
            </div>
            <button onClick={loadIncoming} disabled={status === "loading"}>
              {status === "loading" ? "Loading..." : "Load likes"}
            </button>
          </div>
          {message ? <p className={`message ${status}`}>{message}</p> : null}
          <div className="simple-grid">
            {incoming.map((like) => (
              <div key={like.id} className="simple-card">
                <div>
                  <strong>{like.fromUser?.profile?.name ?? "New admirer"}</strong>
                  <p className="card-subtitle">
                    {like.fromUser?.profile?.city ?? "Unknown city"} • {like.fromUser?.profile?.profession ?? "—"}
                  </p>
                </div>
                <div className="inline-actions">
                  <button className="secondary" onClick={() => respond(like.fromUserId, "PASS")}>
                    Pass
                  </button>
                  <button onClick={() => respond(like.fromUserId, "LIKE")}>Like</button>
                </div>
              </div>
            ))}
            {!incoming.length && status !== "loading" ? (
              <div className="empty-card">
                <h3>No likes yet</h3>
                <p>We’ll notify you as soon as someone sends a like.</p>
              </div>
            ) : null}
          </div>
        </div>
      </AppShell>
    </RouteGuard>
  );
}
