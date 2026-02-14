"use client";

import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ErrorState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { apiEndpoints } from "@/lib/apiEndpoints";

interface RefundStatus {
  eligible: boolean;
  status: "NONE" | "PENDING" | "APPROVED" | "DENIED";
  reason?: string;
}

export default function RefundsPage() {
  const { addToast } = useToast();
  const [refund, setRefund] = useState<RefundStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [reason, setReason] = useState("");

  const fetchRefund = async () => {
    setLoading(true);
    setError(false);
    try {
      await apiFetch(apiEndpoints.refundsMe);
      setRefund({ eligible: true, status: "NONE" });
    } catch {
      setRefund({ eligible: true, status: "NONE" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefund();
  }, []);

  const handleRequest = async () => {
    if (!reason.trim()) {
      addToast("Please provide a reason", "error");
      return;
    }
    setRequesting(true);
    try {
      await apiFetch(apiEndpoints.refundsRequest, {
                body: { reason } as never,
      });
      setRefund((prev) => (prev ? { ...prev, status: "PENDING" } : prev));
      addToast("Refund requested!", "success");
    } catch {
      addToast("Failed to submit request", "error");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Refunds" />
        <Skeleton height={200} radius="var(--radius-lg)" />
      </div>
    );
  }

  if (error || !refund) return <ErrorState onRetry={fetchRefund} />;

  return (
    <div>
      <PageHeader title="Refunds" subtitle="Request and track refund status" />

      <Card style={{ padding: 24, marginBottom: 16 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <h3 style={{ margin: 0 }}>Refund Status</h3>
          <Badge
            variant={
              refund.status === "APPROVED"
                ? "success"
                : refund.status === "DENIED"
                ? "danger"
                : refund.status === "PENDING"
                ? "warning"
                : "default"
            }
          >
            {refund.status === "NONE" ? "No Request" : refund.status}
          </Badge>
        </div>

        {refund.status === "NONE" && refund.eligible ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>
              You are eligible for a refund. Please provide a reason below.
            </p>
            <Textarea
              label="Reason for refund"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tell us why you'd like a refund..."
              rows={4}
            />
            <Button loading={requesting} onClick={handleRequest}>
              Submit Request
            </Button>
          </div>
        ) : refund.status === "PENDING" ? (
          <div
            style={{
              background: "var(--warning-light)",
              padding: 20,
              borderRadius: "var(--radius-md)",
              textAlign: "center",
            }}
          >
            <p style={{ fontWeight: 600, color: "var(--warning)", marginBottom: 4 }}>
              Request Pending
            </p>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
              Your refund request is being reviewed. We will notify you of the outcome.
            </p>
          </div>
        ) : refund.status === "APPROVED" ? (
          <div
            style={{
              background: "var(--success-light)",
              padding: 20,
              borderRadius: "var(--radius-md)",
              textAlign: "center",
            }}
          >
            <p style={{ fontWeight: 600, color: "var(--success)", marginBottom: 4 }}>
              Refund Approved
            </p>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
              Your refund has been processed and will appear in your account within 5-10 business days.
            </p>
          </div>
        ) : refund.status === "DENIED" ? (
          <div
            style={{
              background: "var(--danger-light)",
              padding: 20,
              borderRadius: "var(--radius-md)",
              textAlign: "center",
            }}
          >
            <p style={{ fontWeight: 600, color: "var(--danger)", marginBottom: 4 }}>
              Refund Denied
            </p>
            <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
              Your refund request was denied. Contact support for more information.
            </p>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
