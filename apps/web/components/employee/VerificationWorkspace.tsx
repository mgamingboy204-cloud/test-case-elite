"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Link as LinkIcon, Loader2, RefreshCcw, ShieldBan, UserCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import {
  isValidGoogleMeetUrl,
  type VerificationQueueView
} from "@/lib/workerVerification";
import {
  canAssignVerificationRequest,
  canResolveVerificationRequest,
  canStartVerificationRequest,
  getVerificationOwnershipLabel,
  useApproveVerificationRequestMutation,
  useAssignVerificationRequestMutation,
  useRejectVerificationRequestMutation,
  useStartVerificationRequestMutation,
  useVerificationQueue
} from "@/lib/opsState";
import { CaseActivityPanel } from "@/components/operations/CaseActivityPanel";

const VIEWS: Array<{ value: VerificationQueueView; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "ESCALATED", label: "Escalated" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "ALL", label: "All" }
];

export function VerificationWorkspace({ mode = "employee" }: { mode?: "employee" | "admin" }) {
  const { user } = useAuth();
  const actorUserId = user?.id ?? null;
  const [view, setView] = useState<VerificationQueueView>("ACTIVE");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [meetUrl, setMeetUrl] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const requestsQuery = useVerificationQueue(view);
  const assignMutation = useAssignVerificationRequestMutation();
  const startMutation = useStartVerificationRequestMutation();
  const approveMutation = useApproveVerificationRequestMutation();
  const rejectMutation = useRejectVerificationRequestMutation();
  const requests = requestsQuery.data ?? [];
  const isBusy = busyAction !== null;

  const selected = useMemo(() => requests.find((item) => item.id === selectedId) ?? null, [requests, selectedId]);
  const selectedWhatsAppHelpAt = selected?.escalationRequestedAt ?? null;
  const isValidMeetUrl = useMemo(() => isValidGoogleMeetUrl(meetUrl), [meetUrl]);
  const selectedAssignedToCurrentActor = Boolean(selected && actorUserId && selected.assignedEmployeeId === actorUserId);
  const selectedAssignedToAnotherActor = Boolean(selected?.assignedEmployeeId && selected.assignedEmployeeId !== actorUserId);
  const canClaimSelected = canAssignVerificationRequest(selected, isBusy);
  const canSendLinkSelected = canStartVerificationRequest(selected, actorUserId, isBusy);
  const canResolveSelected = canResolveVerificationRequest(selected, actorUserId, isBusy);
  const loadError = requestsQuery.error instanceof Error ? requestsQuery.error.message : null;

  useEffect(() => {
    setSelectedId((prev) => (prev && requests.some((item) => item.id === prev) ? prev : requests[0]?.id ?? null));
  }, [requests]);

  const refresh = async () => {
    setError(null);
    const result = await requestsQuery.refetch();
    if (result.error) {
      throw result.error;
    }
  };

  const runAction = async (key: string, action: () => Promise<void>, successMessage: string) => {
    if (isBusy) return;
    setBusyAction(key);
    setError(null);
    setFeedback(null);
    try {
      await action();
      setFeedback(successMessage);
      setMeetUrl("");
      setRejectionReason("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to process this request.");
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-6 p-8 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-wide">
            {mode === "admin" ? "Verification Oversight" : "Video Verification Operations"}
          </h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/50">
            {mode === "admin" ? "Admin visibility, intervention, and workflow control" : "Human-managed identity validation queue"}
          </p>
        </div>
        <button
          onClick={() => void refresh().catch((err) => setError(err instanceof Error ? err.message : "Unable to refresh verification workspace."))}
          className="inline-flex items-center gap-2 rounded-full border border-[#2a2f3b] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/75"
        >
          {requestsQuery.isFetching ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />}
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((item) => (
          <button
            key={item.value}
            onClick={() => setView(item.value)}
            className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${view === item.value ? "border-[#C89B90]/45 bg-[#C89B90]/10 text-[#f0c8be]" : "border-[#2a2f3b] text-white/65"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {feedback ? <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">{feedback}</div> : null}
      {error ?? loadError ? <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error ?? loadError}</div> : null}

      {requestsQuery.isPending && requests.length === 0 ? (
        <div className="inline-flex items-center gap-2 rounded-xl border border-[#1f222b] bg-[#0d1016] p-6 text-sm text-white/65">
          <Loader2 size={16} className="animate-spin" /> Loading verification queue...
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-[#1f222b] bg-[#0d1016] p-8 text-sm text-white/60">No verification requests in this view.</div>
      ) : (
        <div className="grid grid-cols-12 gap-5">
          <aside className="col-span-4 max-h-[70vh] space-y-2 overflow-y-auto rounded-xl border border-[#1f222b] bg-[#0d1016] p-3">
            {requests.map((request) => {
              const ownershipLabel = getVerificationOwnershipLabel(request, actorUserId);
              return (
                <button
                  key={request.id}
                  onClick={() => setSelectedId(request.id)}
                  className={`w-full rounded-lg border p-3 text-left ${selectedId === request.id ? "border-[#C89B90]/45 bg-[#C89B90]/10" : "border-[#2a2f3b]"}`}
                >
                  <p className="text-sm">{request.user.phone}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/50">{request.status.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-[10px] text-white/45">{ownershipLabel}</p>
                  {request.escalationRequestedAt ? (
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">WhatsApp Help Requested</p>
                  ) : null}
                  {request.assignedAt ? <p className="mt-1 text-[10px] text-white/45">Updated {new Date(request.assignedAt).toLocaleString()}</p> : null}
                </button>
              );
            })}
          </aside>

          <section className="col-span-8 rounded-xl border border-[#1f222b] bg-[#0d1016] p-6">
            {!selected ? (
              <p className="text-sm text-white/60">Select a verification request.</p>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Phone</p><p>{selected.user.phone}</p></div>
                  <div><p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Email</p><p>{selected.user.email ?? "Not provided"}</p></div>
                  <div><p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Status</p><p>{selected.status.replaceAll("_", " ")}</p></div>
                  <div><p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Requested</p><p>{new Date(selected.createdAt).toLocaleString()}</p></div>
                </div>

                {selectedWhatsAppHelpAt ? (
                  <div className="rounded-xl border border-amber-300/35 bg-amber-500/10 p-3 text-xs text-amber-100">
                    <p className="font-semibold uppercase tracking-[0.14em]">WhatsApp Help Requested</p>
                    <p className="mt-1">Member requested manual contact at {new Date(selectedWhatsAppHelpAt).toLocaleString()}.</p>
                    <p className="mt-1">Phone: <span className="font-semibold">{selected.user.phone}</span></p>
                  </div>
                ) : null}

                <div className="rounded-xl border border-[#2a2f3b] p-3 text-xs text-white/65">
                  {selectedAssignedToAnotherActor
                    ? "This request is already owned by another executive. It remains visible here for queue awareness, but only the owner can send the link or close it."
                    : selectedAssignedToCurrentActor
                      ? "You own this request. Send the meeting link when ready, then record the final decision here."
                      : "This request is waiting for an executive to claim it. Claim it first to move the verification forward."}
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
                  <div className="space-y-3 pt-1">
                    <button
                      disabled={!canClaimSelected}
                      onClick={() =>
                        void runAction(
                          "assign",
                          async () => {
                            await assignMutation.mutateAsync(selected.id);
                          },
                          "Request assigned to you."
                        )
                      }
                      className="w-full rounded-lg border border-[#C89B90]/40 px-3 py-2 text-xs uppercase tracking-[0.15em] text-[#f0c8be] disabled:opacity-45"
                    >
                      <span className="inline-flex items-center gap-2">
                        <UserCheck size={14} />
                        {selectedAssignedToCurrentActor ? "Assigned to you" : selectedAssignedToAnotherActor ? "Already assigned" : "Assign to me"}
                      </span>
                    </button>

                    <div className="flex gap-2">
                      <input
                        value={meetUrl}
                        onChange={(event) => setMeetUrl(event.target.value)}
                        placeholder="https://meet.google.com/..."
                        className="flex-1 rounded-lg border border-[#2a2f3b] bg-black/30 px-3 py-2 text-sm"
                      />
                      <button
                        disabled={!canSendLinkSelected || !isValidMeetUrl}
                        onClick={() =>
                          void runAction(
                            "start",
                            async () => {
                              await startMutation.mutateAsync({ requestId: selected.id, meetUrl: meetUrl.trim() });
                            },
                            "Meet link sent and case moved to in-progress."
                          )
                        }
                        className="rounded-lg border border-primary/40 px-4 py-2 text-xs uppercase tracking-[0.15em] text-primary disabled:opacity-45"
                      >
                        <span className="inline-flex items-center gap-2"><LinkIcon size={14} /> Send link</span>
                      </button>
                    </div>

                    {!isValidMeetUrl && meetUrl.trim() ? (
                      <p className="mt-1 text-[11px] text-amber-300/80">
                        Meet link must start with https://meet.google.com/ and include the meeting path.
                      </p>
                    ) : null}

                    <button
                      disabled={!canResolveSelected}
                      onClick={() =>
                        void runAction(
                          "approve",
                          async () => {
                            await approveMutation.mutateAsync(selected.id);
                          },
                          "Verification approved and member progression updated."
                        )
                      }
                      className="w-full rounded-lg border border-emerald-500/40 px-3 py-2 text-xs uppercase tracking-[0.15em] text-emerald-300 disabled:opacity-45"
                    >
                      <span className="inline-flex items-center gap-2"><CheckCircle2 size={14} /> Mark approved</span>
                    </button>

                    <div className="flex gap-2">
                      <input
                        value={rejectionReason}
                        onChange={(event) => setRejectionReason(event.target.value)}
                        placeholder="Rejection reason"
                        className="flex-1 rounded-lg border border-[#2a2f3b] bg-black/30 px-3 py-2 text-sm"
                      />
                      <button
                        disabled={!canResolveSelected || !rejectionReason.trim()}
                        onClick={() =>
                          void runAction(
                            "reject",
                            async () => {
                              await rejectMutation.mutateAsync({ requestId: selected.id, reason: rejectionReason.trim() });
                            },
                            "Verification rejected and member notified."
                          )
                        }
                        className="rounded-lg border border-red-500/40 px-4 py-2 text-xs uppercase tracking-[0.15em] text-red-300 disabled:opacity-45"
                      >
                        <span className="inline-flex items-center gap-2"><ShieldBan size={14} /> Reject</span>
                      </button>
                    </div>

                    {busyAction ? <p className="inline-flex items-center gap-2 text-xs text-white/60"><Loader2 size={13} className="animate-spin" /> Processing action...</p> : null}
                  </div>

                  <CaseActivityPanel caseType="VERIFICATION" caseId={selected.id} />
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default VerificationWorkspace;
