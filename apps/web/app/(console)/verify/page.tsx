"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Link as LinkIcon, Loader2, RefreshCcw, ShieldBan, UserCheck } from "lucide-react";
import { ApiError } from "@/lib/api";
import {
  approveVerificationRequest,
  assignVerificationRequest,
  listVerificationRequestsForWorker,
  rejectVerificationRequest,
  startVerificationRequest,
  type VerificationQueueView,
  type WorkerVerificationRequest
} from "@/lib/workerVerification";

const VIEWS: Array<{ value: VerificationQueueView; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "TIMEOUT", label: "Timeout" },
  { value: "ALL", label: "All" }
];

export default function VerifyConsolePage() {
  const [view, setView] = useState<VerificationQueueView>("ACTIVE");
  const [requests, setRequests] = useState<WorkerVerificationRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [meetUrl, setMeetUrl] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");

  const selected = useMemo(() => requests.find((item) => item.id === selectedId) ?? null, [requests, selectedId]);

  const isValidMeetUrl = useMemo(() => {
    const value = meetUrl.trim();
    if (!value) return false;
    return /^https:\/\/meet\.google\.com\/.+/.test(value);
  }, [meetUrl]);

  const refresh = async (targetView = view) => {
    const data = await listVerificationRequestsForWorker(targetView);
    setRequests(data.requests);
    setSelectedId((prev) => (prev && data.requests.some((item) => item.id === prev) ? prev : data.requests[0]?.id ?? null));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        await refresh(view);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load verification workspace.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [view]);

  const runAction = async (key: string, action: () => Promise<void>, successMessage: string) => {
    setBusyAction(key);
    setError(null);
    setFeedback(null);
    try {
      await action();
      await refresh();
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
    <div className="p-8 space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif tracking-wide">Video Verification Operations</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/50">Human-managed identity validation queue</p>
        </div>
        <button
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-full border border-[#2a2f3b] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/75"
        >
          <RefreshCcw size={13} /> Refresh
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
      {error ? <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div> : null}

      {loading ? (
        <div className="rounded-xl border border-[#1f222b] bg-[#0d1016] p-6 text-sm text-white/65 inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading verification queue…
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-[#1f222b] bg-[#0d1016] p-8 text-sm text-white/60">No verification requests in this view.</div>
      ) : (
        <div className="grid grid-cols-12 gap-5">
          <aside className="col-span-4 rounded-xl border border-[#1f222b] bg-[#0d1016] p-3 space-y-2 max-h-[70vh] overflow-y-auto">
            {requests.map((request) => (
              <button
                key={request.id}
                onClick={() => setSelectedId(request.id)}
                className={`w-full rounded-lg border p-3 text-left ${selectedId === request.id ? "border-[#C89B90]/45 bg-[#C89B90]/10" : "border-[#2a2f3b]"}`}
              >
                <p className="text-sm">{request.user.phone}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/50">{request.status.replaceAll("_", " ")}</p>
                {request.assignedEmployeeId
                  ? <p className="mt-1 text-[10px] text-white/45">Assigned {request.assignedAt ? new Date(request.assignedAt).toLocaleString() : ""}</p>
                  : <p className="mt-1 text-[10px] text-white/45">Unassigned</p>}
              </button>
            ))}
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

                <div className="rounded-xl border border-[#2a2f3b] p-3 text-xs text-white/65">
                  Verification is always human-led. Share only approved Google Meet links and record every decision through queue actions.
                </div>

                <div className="space-y-3 pt-1">
                  <button
                    disabled={busyAction === "assign" || !["REQUESTED", "ASSIGNED", "IN_PROGRESS"].includes(selected.status)}
                    onClick={() => void runAction("assign", async () => { await assignVerificationRequest(selected.id); }, "Request assigned to you.")}
                    className="w-full rounded-lg border border-[#C89B90]/40 px-3 py-2 text-xs uppercase tracking-[0.15em] text-[#f0c8be] disabled:opacity-45"
                  >
                    <span className="inline-flex items-center gap-2"><UserCheck size={14} /> Claim request</span>
                  </button>

                  <div className="flex gap-2">
                    <input
                      value={meetUrl}
                      onChange={(event) => setMeetUrl(event.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="flex-1 rounded-lg border border-[#2a2f3b] bg-black/30 px-3 py-2 text-sm"
                    />
                    <button
                      disabled={busyAction === "start" || !isValidMeetUrl}
                      onClick={() => void runAction("start", async () => { await startVerificationRequest(selected.id, meetUrl.trim()); }, "Meet link sent and case moved to in-progress.")}
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
                    disabled={busyAction === "approve" || ["COMPLETED", "REJECTED", "TIMED_OUT"].includes(selected.status)}
                    onClick={() => void runAction("approve", async () => { await approveVerificationRequest(selected.id); }, "Verification approved and member progression updated.")}
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
                      disabled={busyAction === "reject" || !rejectionReason.trim()}
                      onClick={() => void runAction("reject", async () => { await rejectVerificationRequest(selected.id, rejectionReason.trim()); }, "Verification rejected and member notified.")}
                      className="rounded-lg border border-red-500/40 px-4 py-2 text-xs uppercase tracking-[0.15em] text-red-300 disabled:opacity-45"
                    >
                      <span className="inline-flex items-center gap-2"><ShieldBan size={14} /> Reject</span>
                    </button>
                  </div>

                  {busyAction ? <p className="text-xs text-white/60 inline-flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Processing action…</p> : null}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
