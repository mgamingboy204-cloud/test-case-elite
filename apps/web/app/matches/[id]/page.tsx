"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../lib/api";
import { queryKeys } from "../../../lib/queryKeys";
import RouteGuard from "../../components/RouteGuard";
import AppShellLayout from "../../components/ui/AppShellLayout";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

type Status = "idle" | "loading" | "success" | "error";

type PhoneUnlockResponse = {
  users?: Array<{ id: string; phone: string }>;
};

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params?.id as string;
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const phoneQuery = useQuery({
    queryKey: queryKeys.phoneUnlock(matchId),
    queryFn: () => apiFetch<PhoneUnlockResponse>(`/phone-unlock/${matchId}`),
    enabled: false,
    staleTime: 30000
  });

  const consentMutation = useMutation({
    mutationFn: (response: "YES" | "NO") =>
      apiFetch("/consent/respond", {
        method: "POST",
        body: JSON.stringify({ matchId, response })
      }),
    onSuccess: (_data, response) =>
      setMessage(response === "YES" ? "Consent recorded. Awaiting match." : "Consent declined."),
    onError: (error) => {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send consent.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsCount });
    }
  });

  function respond(response: "YES" | "NO") {
    setStatus("loading");
    setMessage("Submitting your response...");
    consentMutation.mutate(response, {
      onSuccess: () => setStatus("success")
    });
  }

  function unlockPhones() {
    setStatus("loading");
    setMessage("Checking phone exchange status...");
    void phoneQuery.refetch().then((result) => {
      if (result.isError) {
        setStatus("error");
        setMessage(result.error instanceof Error ? result.error.message : "Unable to unlock phone numbers.");
        return;
      }
      setStatus("success");
      setMessage("Phone numbers unlocked!");
    });
  }

  const phones = phoneQuery.data;

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
                    {phones.users?.map((user) => (
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
