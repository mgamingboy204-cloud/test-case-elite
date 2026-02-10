"use client";

import { useState, useEffect } from "react";
import { Card } from "@/app/components/ui/Card";
import { Badge } from "@/app/components/ui/Badge";
import { Chip } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Avatar } from "@/app/components/ui/Avatar";
import { Modal } from "@/app/components/ui/Modal";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

type VerificationStatus = "REQUESTED" | "IN_PROGRESS" | "APPROVED" | "REJECTED";

type AdminVerificationRequestsResponse = { requests: Array<{ id: string; userId: string; status: "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "APPROVED"; requestedAt?: string; createdAt: string; meetUrl?: string | null; verificationLink?: string | null; user?: { id: string; email?: string | null; phone: string } }>; };

interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  status: VerificationStatus;
  requestedAt: string;
  meetUrl?: string;
}

const STATUS_CHIPS: { label: string; value: string }[] = [
  { label: "All", value: "ALL" },
  { label: "Requested", value: "REQUESTED" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function AdminVideoVerificationsPage() {
  const { addToast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [meetModal, setMeetModal] = useState<{ open: boolean; requestId: string }>({ open: false, requestId: "" });
  const [meetUrl, setMeetLink] = useState("");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; requestId: string }>({ open: false, requestId: "" });
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequests = async () => {
    setLoading(true);
    setError(false);
    try {
      const query = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const response = await apiFetch<AdminVerificationRequestsResponse>(`/admin/verification-requests${query}`);
      setRequests(response.requests.map((r) => ({
        id: r.id,
        userId: r.userId,
        userName: r.user?.email || r.user?.phone || r.userId,
        status: r.status === "COMPLETED" ? "APPROVED" : (r.status as VerificationStatus),
        requestedAt: r.requestedAt || r.createdAt,
        meetUrl: r.meetUrl || r.verificationLink || undefined,
      })));
    } catch {
      setError(true);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const updateRequest = (id: string, updates: Partial<VerificationRequest>) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };


  const handleSendMeetLink = async () => {
    if (!meetUrl.trim() || !meetUrl.includes("meet.google.com")) {
      addToast("Please enter a valid Google Meet link", "error");
      return;
    }
    try {
      await apiFetch(`/admin/verification-requests/${meetModal.requestId}/start`, {
        method: "POST",
        body: { meetUrl } as never,
      });
      updateRequest(meetModal.requestId, { meetUrl, status: "IN_PROGRESS" });
      addToast("Meet link sent", "success");
      setMeetModal({ open: false, requestId: "" });
      setMeetLink("");
    } catch {
      addToast("Failed to send meet link", "error");
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await apiFetch(`/admin/verification-requests/${requestId}/approve`, { method: "POST" });
      updateRequest(requestId, { status: "APPROVED" });
      addToast("Verification approved", "success");
    } catch {
      addToast("Failed to approve", "error");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      addToast("Reason is required", "error");
      return;
    }
    try {
      await apiFetch(`/admin/verification-requests/${rejectModal.requestId}/reject`, {
        method: "POST",
        body: { reason: rejectReason } as never,
      });
      updateRequest(rejectModal.requestId, { status: "REJECTED" });
      addToast("Verification rejected", "success");
      setRejectModal({ open: false, requestId: "" });
      setRejectReason("");
    } catch {
      addToast("Failed to reject", "error");
    }
  };

  const filtered = requests.filter(
    (r) => statusFilter === "ALL" || r.status === statusFilter
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Video Verifications" />
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width={90} height={36} radius="var(--radius-full)" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height={80} radius="var(--radius-lg)" style={{ marginBottom: 12 }} />
        ))}
      </div>
    );
  }

  if (error) return <ErrorState onRetry={fetchRequests} />;

  return (
    <div>
      <PageHeader
        title="Video Verifications"
        subtitle={`${requests.length} verification requests`}
      />

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

      {/* Verification List */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No verification requests"
          description="No requests match the current filter."
          action={{ label: "Show All", onClick: () => setStatusFilter("ALL") }}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((req) => (
            <Card key={req.id} style={{ padding: 20 }}>
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
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 200 }}>
                  <Avatar name={req.userName} size={40} src={req.userPhoto} />
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{req.userName}</p>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted)" }}>
                      Requested {formatDate(req.requestedAt)}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <Badge
                  variant={
                    req.status === "APPROVED"
                      ? "success"
                      : req.status === "REJECTED"
                      ? "danger"
                      : req.status === "IN_PROGRESS"
                      ? "primary"
                      : "warning"
                  }
                >
                  {req.status.replace("_", " ")}
                </Badge>

                {/* Actions */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {req.status === "REQUESTED" && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setMeetModal({ open: true, requestId: req.id })}
                      >
                        Send Meet Link
                      </Button>
                    </>
                  )}
                  {req.status === "IN_PROGRESS" && (
                    <>
                      {req.meetUrl && (
                        <a
                          href={req.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 14px",
                            fontSize: 13,
                            fontWeight: 600,
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                            background: "var(--panel)",
                            color: "var(--primary)",
                          }}
                        >
                          Open Meet
                        </a>
                      )}
                      <Button size="sm" onClick={() => handleApprove(req.id)}>
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setRejectModal({ open: true, requestId: req.id })}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Meet Link Modal */}
      <Modal
        open={meetModal.open}
        onClose={() => { setMeetModal({ open: false, requestId: "" }); setMeetLink(""); }}
        title="Send Meet Link"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
            Enter a Google Meet link to send to the user for their video verification call.
          </p>
          <Input
            label="Google Meet Link"
            value={meetUrl}
            onChange={(e) => setMeetLink(e.target.value)}
            placeholder="https://meet.google.com/..."
            error={meetUrl && !meetUrl.includes("meet.google.com") ? "Must be a valid meet.google.com link" : undefined}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setMeetModal({ open: false, requestId: "" }); setMeetLink(""); }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSendMeetLink}>
              Send Link
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={rejectModal.open}
        onClose={() => { setRejectModal({ open: false, requestId: "" }); setRejectReason(""); }}
        title="Reject Verification"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
            Please provide a reason for rejecting this verification request.
          </p>
          <Textarea
            label="Reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={3}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { setRejectModal({ open: false, requestId: "" }); setRejectReason(""); }}
            >
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleRejectSubmit}>
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
