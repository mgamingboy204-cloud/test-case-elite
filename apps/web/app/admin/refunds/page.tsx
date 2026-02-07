"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../../lib/api";
import { queryKeys } from "../../../lib/queryKeys";

export default function AdminRefundsPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const refundsQuery = useQuery({
    queryKey: queryKeys.adminRefunds,
    queryFn: () => apiFetch("/admin/refunds"),
    staleTime: 5000,
    refetchInterval: 4000
  });

  const decideMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "deny" }) =>
      apiFetch(`/admin/refunds/${id}/${action}`, { method: "POST" }),
    onSuccess: (_data, variables) => {
      setMessage(`Refund ${variables.action}d.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminRefunds });
      queryClient.invalidateQueries({ queryKey: queryKeys.refunds });
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Unable to update refund.");
    },
    onSettled: () => {
      setLoading(false);
    }
  });

  function loadRefunds() {
    setLoading(true);
    setMessage("Loading refund requests...");
    void refundsQuery.refetch().finally(() => setLoading(false));
  }

  function decide(id: string, action: "approve" | "deny") {
    setLoading(true);
    setMessage(`${action === "approve" ? "Approving" : "Denying"} refund...`);
    decideMutation.mutate({ id, action });
  }

  const refunds = refundsQuery.data?.refunds ?? [];

  return (
    <div className="card">
      <h2>Refund Requests</h2>
      <button onClick={loadRefunds} disabled={loading}>
        {loading ? "Loading..." : "Load Refunds"}
      </button>
      {message ? <p className="message">{message}</p> : null}
      <ul className="list">
        {refunds.map((refund: any) => (
          <li key={refund.id} className="list-item">
            <div>
              <strong>{refund.user?.phone ?? "Unknown"}</strong>
              <p className="card-subtitle">{refund.status}</p>
            </div>
            <div className="grid two-column">
              <button onClick={() => decide(refund.id, "approve")} disabled={loading}>
                Approve
              </button>
              <button className="secondary" onClick={() => decide(refund.id, "deny")} disabled={loading}>
                Deny
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
