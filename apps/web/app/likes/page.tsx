"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import RouteGuard from "../components/RouteGuard";
import AppShellLayout from "../components/ui/AppShellLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";

type Status = "idle" | "loading" | "success" | "error";

export default function LikesPage() {
  const router = useRouter();
  const [incoming, setIncoming] = useState<any[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadIncoming();
  }, []);

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
      <AppShellLayout>
        <div className="list-grid">
          <PageHeader
            title="Likes"
            subtitle="People who liked you. Approve to create a match."
            actions={
              <Button variant="secondary" onClick={loadIncoming} disabled={status === "loading"}>
                {status === "loading" ? "Loading..." : "Load likes"}
              </Button>
            }
          />
          {status === "loading" && !incoming.length ? (
            <LoadingState message="Loading incoming likes..." />
          ) : status === "error" ? (
            <ErrorState message={message || "Unable to load likes."} onRetry={loadIncoming} />
          ) : incoming.length ? (
            <div className="list-grid">
              {incoming.map((like) => (
                <Card key={like.id}>
                  <div className="list-row">
                    <div className="list-meta">
                      <div className="list-avatar">
                        {(like.fromUser?.profile?.name ?? "A").slice(0, 1)}
                      </div>
                      <div>
                        <strong>{like.fromUser?.profile?.name ?? "New admirer"}</strong>
                        <p className="text-muted">
                          {like.fromUser?.profile?.city ?? "Unknown city"} •{" "}
                          {like.fromUser?.profile?.profession ?? "—"}
                        </p>
                      </div>
                    </div>
                    <div className="page-header__actions">
                      <Button variant="secondary" onClick={() => respond(like.fromUserId, "PASS")}>
                        Pass
                      </Button>
                      <Button onClick={() => respond(like.fromUserId, "LIKE")}>Like</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No likes yet"
              message="When someone likes you, it will show up here."
              actionLabel="Go to Discover"
              onAction={() => router.push("/discover")}
            />
          )}
          {message && status === "success" ? <p className={`message ${status}`}>{message}</p> : null}
        </div>
      </AppShellLayout>
    </RouteGuard>
  );
}
