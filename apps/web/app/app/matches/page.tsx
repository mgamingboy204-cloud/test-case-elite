"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch } from "../../../lib/api";
import { getAssetUrl } from "../../../lib/assets";
import RouteGuard from "../../components/RouteGuard";

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
    <RouteGuard>
      <div className="card">
        <div>
          <h2>Matches</h2>
          <p className="card-subtitle">Review consent and unlock phone numbers.</p>
        </div>
        <button onClick={loadMatches} disabled={status === "loading"}>
          {status === "loading" ? "Loading..." : "Load Matches"}
        </button>
        {message ? <p className={`message ${status}`}>{message}</p> : null}
        <ul className="list">
          {matches.map((match) => (
            <li key={match.id} className="list-item">
              <div className="list-item-body">
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
              <Link className="text-link" href={`/app/matches/${match.id}`}>
                View
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </RouteGuard>
  );
}
