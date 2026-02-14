"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/app/components/ui/Card";
import { Badge, Chip } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { Textarea } from "@/app/components/ui/Textarea";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { PageHeader } from "@/app/components/ui/PageHeader";
import { Modal } from "@/app/components/ui/Modal";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { apiEndpoints } from "@/lib/apiEndpoints";

type VStatus = "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED";
type VerificationRequest = { id: string; status: VStatus; createdAt: string; meetUrl?: string | null; verificationLink?: string | null; user: { id: string; phone: string; email?: string | null } };

export default function AdminVideoVerificationsPage() {
  const { addToast } = useToast();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<"ALL" | VStatus>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [meetModal, setMeetModal] = useState<{ open: boolean; requestId: string }>({ open: false, requestId: "" });
  const [meetLink, setMeetLink] = useState("");
  const [rejectModal, setRejectModal] = useState<{ open: boolean; requestId: string }>({ open: false, requestId: "" });
  const [rejectReason, setRejectReason] = useState("");

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const query = statusFilter === "ALL" ? "" : `?status=${statusFilter}`;
      const data = (await apiFetch(apiEndpoints.adminVerificationRequests, { params: { query } })) as { requests: VerificationRequest[] };
      setRequests(data.requests || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [statusFilter]);

  const filtered = useMemo(() => requests, [requests]);

  const handleStart = async (requestId: string) => {
    if (!meetLink.trim()) {
      addToast("Meet link is required", "error");
      return;
    }
    try {
      await apiFetch(apiEndpoints.adminVerificationStart, { params: { id: requestId }, body: { meetUrl: meetLink.trim() } as never });
      addToast("Verification started", "success");
      setMeetModal({ open: false, requestId: "" });
      setMeetLink("");
      await load();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed to start", "error");
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await apiFetch(apiEndpoints.adminVerificationApprove, { params: { id: requestId } });
      addToast("Approved", "success");
      await load();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed", "error");
    }
  };

  const handleReject = async () => {
    try {
      await apiFetch(apiEndpoints.adminVerificationReject, { params: { id: rejectModal.requestId }, body: { reason: rejectReason } as never });
      addToast("Rejected", "success");
      setRejectModal({ open: false, requestId: "" });
      setRejectReason("");
      await load();
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Failed", "error");
    }
  };

  if (loading) return <div><PageHeader title="Video Verifications" /><Skeleton height={280} radius="var(--radius-lg)" /></div>;
  if (error) return <ErrorState onRetry={load} />;

  return (
    <div>
      <PageHeader title="Video Verifications" subtitle={`${requests.length} requests`} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {["ALL", "REQUESTED", "IN_PROGRESS", "COMPLETED", "REJECTED"].map((v) => (
          <Chip key={v} label={v.replace("_", " ")} selected={statusFilter === v} onClick={() => setStatusFilter(v as any)} />
        ))}
      </div>
      {!filtered.length ? <EmptyState title="No verification requests" description="No requests match the filter." /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((req) => (
            <Card key={req.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{req.user.email || req.user.phone}</p>
                  <p style={{ margin: "2px 0", fontSize: 12, color: "var(--muted)" }}>{new Date(req.createdAt).toLocaleString()}</p>
                </div>
                <Badge variant={req.status === "COMPLETED" ? "success" : req.status === "REJECTED" ? "danger" : req.status === "IN_PROGRESS" ? "primary" : "warning"}>{req.status}</Badge>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {req.status === "REQUESTED" && <Button size="sm" onClick={() => { setMeetModal({ open: true, requestId: req.id }); setMeetLink(req.meetUrl || ""); }}>Start + Send Meet Link</Button>}
                {req.status === "IN_PROGRESS" && <>
                  <Button size="sm" onClick={() => void handleApprove(req.id)}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => setRejectModal({ open: true, requestId: req.id })}>Reject</Button>
                  {(req.meetUrl || req.verificationLink) && <a href={req.meetUrl || req.verificationLink || "#"} target="_blank" rel="noreferrer"><Button size="sm" variant="secondary">Open Meet</Button></a>}
                </>}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={meetModal.open} onClose={() => setMeetModal({ open: false, requestId: "" })} title="Start verification">
        <Input label="Google Meet URL" value={meetLink} onChange={(e) => setMeetLink(e.target.value)} placeholder="https://meet.google.com/..." />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}><Button size="sm" onClick={() => void handleStart(meetModal.requestId)}>Start</Button></div>
      </Modal>

      <Modal open={rejectModal.open} onClose={() => setRejectModal({ open: false, requestId: "" })} title="Reject verification">
        <Textarea label="Reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}><Button size="sm" variant="danger" onClick={() => void handleReject()}>Reject</Button></div>
      </Modal>
    </div>
  );
}
