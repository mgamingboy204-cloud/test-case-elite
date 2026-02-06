"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import RouteGuard from "../../components/RouteGuard";
import AppShellLayout from "../../components/ui/AppShellLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

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
    <RouteGuard requireActive>
      <AppShellLayout>
        <div className="list-grid">
          <PageHeader title="Match Detail" subtitle={`Match ID: ${matchId}`} />
          <Card>
            <div className="page-header__actions">
              <Button onClick={() => respond("YES")} disabled={status === "loading"}>
                Consent YES
              </Button>
              <Button variant="secondary" onClick={() => respond("NO")} disabled={status === "loading"}>
                Consent NO
              </Button>
              <Button variant="ghost" onClick={unlockPhones} disabled={status === "loading"}>
                {status === "loading" ? "Checking..." : "Unlock Phones"}
              </Button>
            </div>
            {message ? <p className={`message ${status}`}>{message}</p> : null}
            {phones ? (
              <Card variant="muted">
                <h3>Unlocked numbers</h3>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {phones.users?.map((user: any) => (
                      <tr key={user.id}>
                        <td>Member {user.id.slice(0, 6)}</td>
                        <td>{user.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            ) : null}
          </Card>
        </div>
      </AppShellLayout>
    </RouteGuard>
  );
}
