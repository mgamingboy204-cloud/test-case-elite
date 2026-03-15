"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";
import { CheckCircle2, Link as LinkIcon, Loader2, ShieldBan, UserCheck } from "lucide-react";

type VerificationRequest = {
  id: string;
  status: "REQUESTED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "TIMED_OUT";
  meetUrl: string | null;
  reason: string | null;
  createdAt: string;
  assignedAt: string | null;
  user: {
    id: string;
    phone: string;
    email: string | null;
  };
};

export default function VerifyConsolePage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [meetUrl, setMeetUrl] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    const data = await apiRequest<{ requests: VerificationRequest[] }>("/admin/verification-requests?status=ALL", { auth: true });
    setRequests(data.requests);
    setSelectedId((prev) => prev ?? data.requests[0]?.id ?? null);
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await fetchRequests();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load verification queue.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const selected = useMemo(() => requests.find((item) => item.id === selectedId) ?? null, [requests, selectedId]);

  const runAction = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await fetchRequests();
      setMeetUrl("");
      setRejectionReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-serif tracking-wide text-white">Video Verification Operations</h1>
        <p className="text-xs uppercase tracking-[0.2em] text-white/40 mt-2">Human-managed queue for live identity validation.</p>
      </div>

      {loading ? <p className="text-white/60">Loading queue…</p> : null}
      {error ? <p className="text-red-400 text-sm">{error}</p> : null}

      {!loading && requests.length === 0 ? (
        <div className="rounded-xl border border-[#1f222b] bg-white/[0.02] p-6 text-white/60">No pending verification requests.</div>
      ) : null}

      {!loading && requests.length > 0 ? (
        <div className="grid grid-cols-12 gap-5">
          <aside className="col-span-4 rounded-xl border border-[#1f222b] bg-[#0a0c10]/60 p-4 space-y-2 max-h-[70vh] overflow-y-auto">
            {requests.map((request) => (
              <button
                key={request.id}
                onClick={() => setSelectedId(request.id)}
                className={`w-full rounded-lg border px-3 py-3 text-left ${
                  selectedId === request.id ? "border-[#C89B90]/50 bg-[#C89B90]/10" : "border-[#1f222b] bg-white/[0.01]"
                }`}
              >
                <p className="text-sm text-white">{request.user.phone}</p>
                <p className="text-[11px] uppercase tracking-[0.15em] text-white/50">{request.status}</p>
              </button>
            ))}
          </aside>

          <section className="col-span-8 rounded-xl border border-[#1f222b] bg-[#0a0c10]/70 p-6 space-y-4">
            {selected ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm text-white/80">
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider">Member phone</p>
                    <p>{selected.user.phone}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider">Email</p>
                    <p>{selected.user.email || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider">Current status</p>
                    <p>{selected.status}</p>
                  </div>
                  <div>
                    <p className="text-white/40 text-xs uppercase tracking-wider">Requested at</p>
                    <p>{new Date(selected.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-3 border-t border-[#1f222b] pt-4">
                  <button
                    disabled={busy || selected.status !== "REQUESTED"}
                    onClick={() =>
                      runAction(async () => {
                        await apiRequest(`/admin/verification-requests/${selected.id}/assign`, {
                          method: "POST",
                          auth: true,
                          body: JSON.stringify({})
                        });
                      })
                    }
                    className="w-full rounded-lg border border-[#C89B90]/35 px-4 py-3 text-xs uppercase tracking-[0.16em] text-[#C89B90] disabled:opacity-45"
                  >
                    <span className="inline-flex items-center gap-2">
                      <UserCheck size={14} /> Pick request
                    </span>
                  </button>

                  <div className="flex gap-2">
                    <input
                      value={meetUrl}
                      onChange={(event) => setMeetUrl(event.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="flex-1 rounded-lg border border-[#1f222b] bg-black/40 px-3 py-2 text-sm text-white"
                    />
                    <button
                      disabled={busy || !meetUrl.trim()}
                      onClick={() =>
                        runAction(async () => {
                          await apiRequest(`/admin/verification-requests/${selected.id}/start`, {
                            method: "POST",
                            auth: true,
                            body: JSON.stringify({ meetUrl: meetUrl.trim() })
                          });
                        })
                      }
                      className="rounded-lg border border-primary/35 px-4 py-2 text-xs uppercase tracking-[0.16em] text-primary disabled:opacity-45"
                    >
                      <span className="inline-flex items-center gap-2">
                        <LinkIcon size={14} /> Send Meet link
                      </span>
                    </button>
                  </div>

                  <button
                    disabled={busy || selected.status === "COMPLETED"}
                    onClick={() =>
                      runAction(async () => {
                        await apiRequest(`/admin/verification-requests/${selected.id}/approve`, {
                          method: "POST",
                          auth: true,
                          body: JSON.stringify({})
                        });
                      })
                    }
                    className="w-full rounded-lg border border-emerald-500/40 px-4 py-3 text-xs uppercase tracking-[0.16em] text-emerald-400 disabled:opacity-45"
                  >
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle2 size={14} /> Mark approved
                    </span>
                  </button>

                  <div className="flex gap-2">
                    <input
                      value={rejectionReason}
                      onChange={(event) => setRejectionReason(event.target.value)}
                      placeholder="Reason (use fake/fraud for ban)"
                      className="flex-1 rounded-lg border border-[#1f222b] bg-black/40 px-3 py-2 text-sm text-white"
                    />
                    <button
                      disabled={busy || !rejectionReason.trim()}
                      onClick={() =>
                        runAction(async () => {
                          await apiRequest(`/admin/verification-requests/${selected.id}/reject`, {
                            method: "POST",
                            auth: true,
                            body: JSON.stringify({ reason: rejectionReason })
                          });
                        })
                      }
                      className="rounded-lg border border-red-500/40 px-4 py-2 text-xs uppercase tracking-[0.16em] text-red-400 disabled:opacity-45"
                    >
                      <span className="inline-flex items-center gap-2">
                        <ShieldBan size={14} /> Reject
                      </span>
                    </button>
                  </div>

                  {busy ? (
                    <p className="text-xs text-white/60 inline-flex items-center gap-2">
                      <Loader2 className="animate-spin" size={13} /> Updating request…
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
