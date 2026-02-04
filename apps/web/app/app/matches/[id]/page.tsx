"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../../lib/api";
import RouteGuard from "../../../components/RouteGuard";

type Status = "idle" | "loading" | "success" | "error";

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params?.id as string;
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [phones, setPhones] = useState<any>(null);

  async function respond(response: "YES" | "NO") {
    setStatus("loading");
    setMessage("Submitting your response...");
    try {
      await apiFetch("/consent/respond", {
        method: "POST",
        body: JSON.stringify({ matchId, response })
      });
      setStatus("success");
      setMessage(response === "YES" ? "Consent recorded. Awaiting match." : "Consent declined.");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send consent.");
    }
  }

  async function unlockPhones() {
    setStatus("loading");
    setMessage("Checking phone exchange status...");
    try {
      const data = await apiFetch(`/phone-unlock/${matchId}`);
      setPhones(data);
      setStatus("success");
      setMessage("Phone numbers unlocked!");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to unlock phone numbers.");
    }
  }

  return (
    <RouteGuard>
      <div className="card">
        <div>
          <h2>Match Detail</h2>
          <p className="card-subtitle">Match ID: {matchId}</p>
        </div>
        <div className="grid two-column">
          <button onClick={() => respond("YES")} disabled={status === "loading"}>
            Consent YES
          </button>
          <button className="secondary" onClick={() => respond("NO")} disabled={status === "loading"}>
            Consent NO
          </button>
        </div>
        <button onClick={unlockPhones} disabled={status === "loading"}>
          {status === "loading" ? "Checking..." : "Unlock Phones"}
        </button>
        {message ? <p className={`message ${status}`}>{message}</p> : null}
        {phones ? (
          <div className="card muted">
            <h3>Unlocked numbers</h3>
            <ul className="list">
              {phones.users?.map((user: any) => (
                <li key={user.id} className="list-item">
                  <span>Member {user.id.slice(0, 6)}</span>
                  <strong>{user.phone}</strong>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </RouteGuard>
  );
}
