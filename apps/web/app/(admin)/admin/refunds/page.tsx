"use client";

import { useEffect, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

type RefundRequest = { id: string; status: "PENDING" | "APPROVED" | "DENIED"; reason?: string | null; requestedAt: string; user?: { phone?: string; email?: string | null } };

export default function AdminRefundsPage() {
  const { addToast } = useToast();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiFetch<{ refunds: RefundRequest[] }>("/admin/refunds");
      setRefunds(data.refunds || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const decide = async (refundId: string, action: "approve" | "deny") => {
    try {
      await apiFetch(`/admin/refunds/${refundId}/${action}`, { method: "POST" });
      addToast(`Refund ${action}d`, "success");
      await load();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Action failed", "error");
    }
  };

  if (loading) return <div><PageHeader title="Refunds" /><Skeleton height={240} radius="var(--radius-lg)" /></div>;
  if (error) return <ErrorState onRetry={load} />;
  if (!refunds.length) return <EmptyState title="No refunds" description="No refund requests found." />;

  return (
    <div>
      <PageHeader title="Refunds" subtitle={`${refunds.length} requests`} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {refunds.map((refund) => (
          <Card key={refund.id} style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600 }}>{refund.user?.phone || "Unknown user"}</p>
                <p style={{ margin: "2px 0", fontSize: 13, color: "var(--muted)" }}>{refund.user?.email || "No email"}</p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>{new Date(refund.requestedAt).toLocaleString()}</p>
              </div>
              <Badge variant={refund.status === "APPROVED" ? "success" : refund.status === "PENDING" ? "warning" : "danger"}>{refund.status}</Badge>
            </div>
            <p style={{ marginTop: 10, color: "var(--muted)", fontSize: 14 }}>{refund.reason || "No reason provided."}</p>
            {refund.status === "PENDING" && (
              <div style={{ display: "flex", gap: 8 }}>
                <Button size="sm" onClick={() => void decide(refund.id, "approve")}>Approve</Button>
                <Button size="sm" variant="danger" onClick={() => void decide(refund.id, "deny")}>Deny</Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
