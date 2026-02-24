"use client";

import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Chip } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Avatar } from "@/app/components/ui/Avatar";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

type RefundStatus = "PENDING" | "APPROVED" | "DENIED";

interface RefundRequest {
  id: string;
  userName: string;
  userPhoto?: string;
  reason: string;
  amount: string;
  status: RefundStatus;
  requestedAt: string;
}

const MOCK_REFUNDS: RefundRequest[] = [
  { id: "ref1", userName: "Sarah Johnson", reason: "Not satisfied with the service", amount: "$29.99", status: "PENDING", requestedAt: "2025-12-10" },
  { id: "ref2", userName: "Marcus Lee", reason: "Accidental purchase", amount: "$29.99", status: "PENDING", requestedAt: "2025-12-09" },
  { id: "ref3", userName: "Emma Wilson", reason: "Found a better alternative", amount: "$49.99", status: "APPROVED", requestedAt: "2025-12-08" },
  { id: "ref4", userName: "James Chen", reason: "Feature missing", amount: "$29.99", status: "DENIED", requestedAt: "2025-12-07" },
  { id: "ref5", userName: "Olivia Davis", reason: "Technical issues preventing use", amount: "$29.99", status: "PENDING", requestedAt: "2025-12-06" },
];

const STATUS_CHIPS = [
  { label: "All", value: "ALL" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Denied", value: "DENIED" },
];

export default function AdminRefundsPage() {
  const { addToast } = useToast();
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchRefunds = async () => {
    setLoading(true);
    setError(false);
    try {
      await apiFetch("/admin/refunds");
      setRefunds(MOCK_REFUNDS);
    } catch {
      setRefunds(MOCK_REFUNDS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleApprove = async (refundId: string) => {
    try {
      await apiFetch(`/admin/refunds/${refundId}/approve`, { method: "POST" });
      setRefunds((prev) =>
        prev.map((r) => (r.id === refundId ? { ...r, status: "APPROVED" as const } : r))
      );
      addToast("Refund approved", "success");
    } catch {
      addToast("Failed to approve refund", "error");
    }
  };

  const handleDeny = async (refundId: string) => {
    try {
      await apiFetch(`/admin/refunds/${refundId}/deny`, { method: "POST" });
      setRefunds((prev) =>
        prev.map((r) => (r.id === refundId ? { ...r, status: "DENIED" as const } : r))
      );
      addToast("Refund denied", "success");
    } catch {
      addToast("Failed to deny refund", "error");
    }
  };

  const filtered = refunds.filter(
    (r) => statusFilter === "ALL" || r.status === statusFilter
  );

  if (loading) {
    return (
      <div>
        <PageHeader title="Refunds" />
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} width={90} height={36} radius="var(--radius-full)" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={100} radius="var(--radius-lg)" style={{ marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  if (error) return <ErrorState onRetry={fetchRefunds} />;

  return (
    <div>
      <PageHeader title="Refunds" subtitle={`${refunds.length} refund requests`} />

      {/* Status Filter Chips */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {STATUS_CHIPS.map((chip) => (
          <Chip
            key={chip.value}
            label={chip.label}
            selected={statusFilter === chip.value}
            onClick={() => setStatusFilter(chip.value)}
          />
        ))}
      </div>

      {/* Refunds List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No refund requests"
          description="No requests match the current filter."
          action={{ label: "Show All", onClick: () => setStatusFilter("ALL") }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((refund) => (
            <Card key={refund.id} style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                {/* User info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 180 }}>
                  <Avatar name={refund.userName} size={40} src={refund.userPhoto} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{refund.userName}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted)" }}>
                      {refund.requestedAt}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                <div style={{ textAlign: "right", minWidth: 80 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 16 }}>{refund.amount}</p>
                </div>

                {/* Status */}
                <Badge
                  variant={
                    refund.status === "APPROVED"
                      ? "success"
                      : refund.status === "DENIED"
                      ? "danger"
                      : "warning"
                  }
                >
                  {refund.status}
                </Badge>

                {/* Actions */}
                {refund.status === "PENDING" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button size="sm" onClick={() => handleApprove(refund.id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeny(refund.id)}>
                      Deny
                    </Button>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div
                style={{
                  background: "var(--bg)",
                  padding: 12,
                  borderRadius: "var(--radius-md)",
                  marginTop: 12,
                }}
              >
                <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
                  <span style={{ fontWeight: 500, color: "var(--text)" }}>Reason:</span>{" "}
                  {refund.reason}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
