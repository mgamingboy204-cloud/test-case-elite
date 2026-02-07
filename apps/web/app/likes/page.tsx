"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";
import RouteGuard from "../components/RouteGuard";
import AppShellLayout from "../components/ui/AppShellLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";

type Status = "idle" | "loading" | "success" | "error";

type IncomingResponse = { incoming: any[] };

export default function LikesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const incomingQuery = useQuery({
    queryKey: queryKeys.likes,
    queryFn: () => apiFetch<IncomingResponse>("/likes/incoming"),
    staleTime: 10000
  });

  const respondMutation = useMutation({
    mutationFn: ({ toUserId, type }: { toUserId: string; type: "LIKE" | "PASS" }) =>
      apiFetch("/likes", {
        method: "POST",
        body: JSON.stringify({ toUserId, type })
      }),
    onSuccess: (_data, variables) => {
      setStatus("success");
      setMessage(variables.type === "LIKE" ? "Match approved!" : "Request rejected.");
      queryClient.invalidateQueries({ queryKey: queryKeys.likes });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsCount });
      queryClient.invalidateQueries({ queryKey: queryKeys.discoverFeed("dating") });
      queryClient.invalidateQueries({ queryKey: queryKeys.discoverFeed("friends") });
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to respond.");
    }
  });

  const incoming = incomingQuery.data?.incoming ?? [];

  function loadIncoming() {
    setStatus("loading");
    setMessage("Loading incoming likes...");
    void incomingQuery.refetch().then((result) => {
      if (result.data?.incoming?.length) {
        setStatus("success");
        setMessage("Review your incoming likes.");
      } else if (result.isSuccess) {
        setStatus("success");
        setMessage("No new requests yet.");
      }
    });
  }

  function respond(toUserId: string, type: "LIKE" | "PASS") {
    setStatus("loading");
    setMessage(type === "LIKE" ? "Approving..." : "Rejecting...");
    respondMutation.mutate({ toUserId, type });
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
          {incomingQuery.isLoading && !incoming.length ? (
            <LoadingState message="Loading incoming likes..." />
          ) : incomingQuery.isError ? (
            <ErrorState
              message={
                message ||
                (incomingQuery.error instanceof Error ? incomingQuery.error.message : "Unable to load likes.")
              }
              onRetry={loadIncoming}
            />
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
