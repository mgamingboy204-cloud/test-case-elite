"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { ApiError, apiRequestAuth } from "@/lib/api";

type PendingVerificationRequest = {
  id: string;
  status: "PENDING";
  user: { name: string; phoneLast4: string };
  requestedAt: string;
  waitTimeSeconds: number;
  waitTimeMinutes: number;
  waitTimeRemainingSeconds: number;
};

type Stage = "PENDING" | "ASSIGNED" | "MEET_SENT" | "DONE";

function formatWaitTime(r: PendingVerificationRequest) {
  const mm = r.waitTimeMinutes;
  const ss = r.waitTimeRemainingSeconds;
  if (mm <= 0) return `${ss}s`;
  return `${mm}m ${ss}s`;
}

export default function EmployeeVerificationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<PendingVerificationRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("PENDING");
  const [selectedRequest, setSelectedRequest] = useState<PendingVerificationRequest | null>(null);

  const [meetLink, setMeetLink] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const refresh = async (opts?: { keepSelectedSnapshot?: boolean }) => {
    const res = await apiRequestAuth<{ requests: PendingVerificationRequest[] }>("/employee/verification");
    setRequests(res.requests);

    setSelectedId((prev) => {
      if (prev) return prev;
      return res.requests[0]?.id ?? null;
    });

    if (opts?.keepSelectedSnapshot) return;

    if (selectedId) {
      if (stage === "PENDING") {
        const stillPending = res.requests.find((r) => r.id === selectedId) ?? null;
        setSelectedRequest(stillPending);
      }
    } else {
      setSelectedRequest(res.requests[0] ?? null);
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await refresh();
      } catch (err) {
        const apiErr = err instanceof ApiError ? err : null;
        setError(apiErr?.message ?? (err instanceof Error ? err.message : "Unable to load queue."));
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const pickUp = async (id: string) => {
    setBusy(true);
    setFeedback(null);
    try {
      await apiRequestAuth(`/employee/verification/${id}/assign`, { method: "POST", body: JSON.stringify({}) });
      setSelectedId(id);
      setStage("ASSIGNED");
      // Refresh pending list (assigned item should disappear),
      // but keep the right-side snapshot.
      await refresh({ keepSelectedSnapshot: true }).catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  const sendMeetLink = async () => {
    if (!selectedId) return;
    setBusy(true);
    setFeedback(null);
    try {
      await apiRequestAuth(`/employee/verification/${selectedId}/send-meet-link`, {
        method: "POST",
        body: JSON.stringify({ meetLink })
      });
      setStage("MEET_SENT");
      setFeedback("Meet link sent. Choose APPROVED or REJECTED.");
    } finally {
      setBusy(false);
    }
  };

  const submitResult = async (result: "APPROVED" | "REJECTED") => {
    if (!selectedId) return;
    setBusy(true);
    setFeedback(null);
    try {
      await apiRequestAuth(`/employee/verification/${selectedId}/result`, {
        method: "POST",
        body: JSON.stringify({ result, notes })
      });
      setStage("DONE");
      setFeedback(result === "APPROVED" ? "Verification approved." : "Verification rejected.");
      setMeetLink("");
      setNotes("");
      // Refresh queue after decision.
      await refresh({ keepSelectedSnapshot: false }).catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-8 space-y-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif tracking-wide uppercase">Verification Queue</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/50">Pending requests only</p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void refresh().catch(() => undefined)}
          className="inline-flex items-center gap-2 rounded-full border border-[#2a2f3b] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/75 disabled:opacity-60"
        >
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      {error ? <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-4 text-xs text-red-200">{error}</div> : null}
      {feedback ? <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-xs text-emerald-300">{feedback}</div> : null}

      {loading ? (
        <div className="rounded-xl border border-[#1f222b] bg-[#0d1016] p-6 text-sm text-white/65 inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading pending verifications…
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[340px,1fr]">
          <aside className="rounded-xl border border-[#1f222b] bg-[#0d1016] p-3 max-h-[70vh] overflow-y-auto">
            {requests.length === 0 ? (
              <div className="p-6 text-sm text-white/60">No pending verification requests.</div>
            ) : (
              <div className="space-y-2">
                {requests.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(r.id);
                      setSelectedRequest(r);
                      setStage("PENDING");
                      setMeetLink("");
                      setNotes("");
                      setFeedback(null);
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                      selectedId === r.id ? "border-[#C89B90]/45 bg-[#C89B90]/10" : "border-[#2a2f3b] hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{r.user.name}</p>
                      <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">{new Date(r.requestedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/45">Phone •••• {r.user.phoneLast4}</p>
                    <p className="mt-2 text-[11px] text-white/70">Wait {formatWaitTime(r)}</p>
                    <div className="mt-3">
                      <span className="inline-flex items-center rounded-full border border-[#C89B90]/40 bg-[#C89B90]/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-[#f0c8be]">
                        PENDING
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <section className="rounded-xl border border-[#1f222b] bg-[#0d1016] p-6">
            {!selectedId ? (
              <p className="text-sm text-white/60">Select a pending request.</p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#2a2f3b] p-4 text-xs text-white/70">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="uppercase tracking-[0.14em] text-white/45">Member</p>
                      <p className="mt-1 text-sm text-white/85">{selectedRequest?.user.name ?? "Member"}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-white/45">
                        Phone •••• {selectedRequest?.user.phoneLast4 ?? "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="uppercase tracking-[0.14em] text-white/45">Wait</p>
                      <p className="mt-1 text-sm text-white/85">
                        {selectedRequest ? formatWaitTime(selectedRequest) : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {stage === "PENDING" ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void pickUp(selectedId)}
                    className="w-full rounded-lg border border-[#C89B90]/45 bg-[#C89B90]/10 px-3 py-3 text-xs uppercase tracking-[0.15em] text-[#f0c8be] disabled:opacity-60"
                  >
                    {busy ? "Picking up…" : "Pick up"}
                  </button>
                ) : null}

                {stage === "ASSIGNED" || stage === "MEET_SENT" ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.14em] text-white/45 mb-2">Meet link</label>
                      <input
                        value={meetLink}
                        onChange={(e) => setMeetLink(e.target.value)}
                        placeholder="https://meet.google.com/abc-def-ghi"
                        className="w-full rounded-lg border border-[#2a2f3b] bg-black/30 px-3 py-2 text-sm text-white focus:outline-none"
                      />
                    </div>
                    {stage === "ASSIGNED" ? (
                      <button
                        type="button"
                        disabled={busy || !meetLink.trim()}
                        onClick={() => void sendMeetLink()}
                        className="w-full rounded-lg border border-primary/40 px-3 py-3 text-xs uppercase tracking-[0.15em] text-primary disabled:opacity-60"
                      >
                        {busy ? "Sending…" : "Send to member"}
                      </button>
                    ) : null}

                    {stage === "MEET_SENT" ? (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[10px] uppercase tracking-[0.14em] text-white/45 mb-2">Notes (optional)</label>
                          <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-[#2a2f3b] bg-black/30 px-3 py-2 text-sm text-white focus:outline-none"
                            placeholder="Reason / notes for decision"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void submitResult("APPROVED")}
                            className="rounded-lg border border-emerald-500/40 px-3 py-3 text-xs uppercase tracking-[0.15em] text-emerald-300 disabled:opacity-60"
                          >
                            APPROVE
                          </button>
                          <button
                            type="button"
                            disabled={busy || !notes.trim()}
                            onClick={() => void submitResult("REJECTED")}
                            className="rounded-lg border border-red-500/40 px-3 py-3 text-xs uppercase tracking-[0.15em] text-red-300 disabled:opacity-60"
                          >
                            REJECT
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}


