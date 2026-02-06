"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { getAssetUrl } from "../../lib/assets";
import RouteGuard from "../components/RouteGuard";
import AppShellLayout from "../components/ui/AppShellLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";
import PageHeader from "../components/ui/PageHeader";

type Status = "idle" | "loading" | "success" | "error";

export default function MatchesPage() {
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadMatches();
  }, []);

  async function loadMatches() {
    setStatus("loading");
    setMessage("Fetching your matches...");
    try {
      const data = await apiFetch<{ matches: any[] }>("/matches");
      setMatches(data.matches ?? []);
      setStatus("success");
      setMessage(data.matches?.length ? "Matches ready." : "No matches yet.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to load matches.");
    }
  }

  return (
    <RouteGuard requireActive>
      <AppShellLayout>
        <div className="list-grid">
          <PageHeader
            title="Matches"
            subtitle="Review consent and unlock phone numbers."
            actions={
              <Button variant="secondary" onClick={loadMatches} disabled={status === "loading"}>
                {status === "loading" ? "Loading..." : "Load matches"}
              </Button>
            }
          />
          {status === "loading" && !matches.length ? (
            <LoadingState message="Fetching your matches..." />
          ) : status === "error" ? (
            <ErrorState message={message || "Unable to load matches."} onRetry={loadMatches} />
          ) : matches.length ? (
            <div className="list-grid">
              {matches.map((match) => (
                <Card key={match.id}>
                  <div className="list-row">
                    <div className="list-meta">
                      <div className="list-avatar">
                        {match.user?.primaryPhotoUrl ? (
                          <img
                            src={getAssetUrl(match.user.primaryPhotoUrl) ?? ""}
                            alt={match.user?.name ?? "Match"}
                          />
                        ) : (
                          <span>{match.user?.name?.slice(0, 1) ?? "M"}</span>
                        )}
                      </div>
                      <div>
                        <strong>{match.user?.name ?? "Match"}</strong>
                        <p className="text-muted">
                          {match.user?.city ?? "Location"}{" "}
                          {match.user?.profession ? `• ${match.user.profession}` : ""}
                        </p>
                        <p className="text-muted">Status: {match.consentStatus ?? "PENDING"}</p>
                      </div>
                    </div>
                    <Link className="text-button" href={`/matches/${match.id}`}>
                      View details
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No matches yet"
              message="Keep discovering to unlock new introductions."
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
