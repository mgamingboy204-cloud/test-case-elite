"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "../../lib/api";
import { getAssetUrl } from "../../lib/assets";
import RouteGuard from "../components/RouteGuard";
import AppShell from "../components/AppShell";

type Status = "idle" | "loading" | "success" | "error";

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

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
      <AppShell>
        <div className="stack-page">
          <div className="page-header">
            <div>
              <h2>Matches</h2>
              <p className="card-subtitle">Review consent and unlock phone numbers.</p>
            </div>
            <button onClick={loadMatches} disabled={status === "loading"}>
              {status === "loading" ? "Loading..." : "Load matches"}
            </button>
          </div>
          {message ? <p className={`message ${status}`}>{message}</p> : null}
          <div className="simple-grid">
            {matches.map((match) => (
              <div key={match.id} className="simple-card match-card">
                <div className="match-summary">
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
                    <p className="card-subtitle">
                      {match.user?.city ?? "Location"} {match.user?.profession ? `• ${match.user.profession}` : ""}
                    </p>
                    <p className="card-subtitle">Status: {match.consentStatus ?? "PENDING"}</p>
                  </div>
                </div>
                <Link className="text-link" href={`/matches/${match.id}`}>
                  View details
                </Link>
              </div>
            ))}
            {!matches.length && status !== "loading" ? (
              <div className="empty-card">
                <h3>No matches yet</h3>
                <p>Keep discovering to unlock new introductions.</p>
              </div>
            ) : null}
          </div>
        </div>
      </AppShell>
    </RouteGuard>
  );
}
