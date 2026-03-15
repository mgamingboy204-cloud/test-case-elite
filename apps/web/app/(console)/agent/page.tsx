"use client";

import { useMemo, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import {
  assignOfflineMeetCase,
  finalizeOfflineMeet,
  listOfflineMeetCasesForEmployee,
  markOfflineMeetNoOverlap,
  markOfflineMeetTimeout,
  sendOfflineMeetOptions,
  updateOfflineMeetCase
} from "@/lib/offlineMeet";
import { useStaleWhileRevalidate } from "@/lib/cache";
import { ApiError } from "@/lib/api";

function makeOptionId(prefix: string, idx: number) {
  return `${prefix}-${idx + 1}`;
}

export default function AgentWorkspace() {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [cafes, setCafes] = useState([{ name: "", address: "" }, { name: "", address: "" }, { name: "", address: "" }]);
  const [timeSlots, setTimeSlots] = useState(["", "", ""]);

  const casesQuery = useStaleWhileRevalidate({ key: "agent-offline-meets", fetcher: async () => (await listOfflineMeetCasesForEmployee()).cases, staleTimeMs: 30_000, enabled: true });
  const items = useMemo(() => casesQuery.data ?? [], [casesQuery.data]);
  const selected = items.find((entry) => entry.id === selectedCaseId) ?? null;

  const withAction = async (key: string, run: () => Promise<void>) => {
    setBusy(key);
    setFeedback(null);
    try {
      await run();
      await casesQuery.refresh(true);
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : "Operation failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-8 text-foreground">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl tracking-[0.2em] uppercase">Offline Meet Concierge</h1>
        <button onClick={() => void casesQuery.refresh(true)} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] border border-border/40 rounded-full px-3 py-1.5">
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      {feedback ? <div className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">{feedback}</div> : null}

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-3">
          {items.map((item) => (
            <button key={item.id} onClick={() => setSelectedCaseId(item.id)} className={`w-full text-left rounded-xl border p-3 ${selectedCaseId === item.id ? "border-primary/40 bg-primary/5" : "border-border/40"}`}>
              <p className="text-xs uppercase tracking-[0.15em] text-primary/80">{item.status.replaceAll("_", " ")}</p>
              <p className="mt-1 text-sm">{item.users[0]?.name} & {item.users[1]?.name}</p>
              <p className="mt-1 text-[11px] text-foreground/60">{item.users[0]?.locationLabel} • {item.users[1]?.locationLabel}</p>
            </button>
          ))}
          {!casesQuery.isRefreshing && items.length === 0 ? <div className="rounded-xl border border-border/40 p-4 text-sm text-foreground/65">No active offline meet cases.</div> : null}
        </div>

        <div className="col-span-2 rounded-2xl border border-border/40 p-5">
          {!selected ? <p className="text-sm text-foreground/60">Select a case to manage concierge coordination.</p> : (
            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-primary">{selected.status.replaceAll("_", " ")}</p>
                <h2 className="text-xl mt-1">{selected.users[0]?.name} × {selected.users[1]?.name}</h2>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button disabled={busy === "assign"} onClick={() => void withAction("assign", async () => { await assignOfflineMeetCase(selected.id); setFeedback("Case assigned to you."); })} className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.15em]">{busy === "assign" ? <Loader2 size={12} className="animate-spin inline" /> : "Assign"}</button>
                <button disabled={busy === "no-overlap"} onClick={() => void withAction("no-overlap", async () => { await markOfflineMeetNoOverlap(selected.id); setFeedback("No-overlap recorded with 1-day cooldown."); })} className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.15em]">Mark No Overlap</button>
                <button disabled={busy === "timeout"} onClick={() => void withAction("timeout", async () => { await markOfflineMeetTimeout(selected.id, selected.users[1]?.id ?? ""); setFeedback("Timeout marked."); })} className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.15em]">Mark Timeout</button>
                <button disabled={busy === "reschedule"} onClick={() => void withAction("reschedule", async () => { await updateOfflineMeetCase(selected.id, { action: "RESCHEDULE", reason: "Member requested reschedule for serious reason." }); setFeedback("Reschedule request recorded."); })} className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.15em]">Reschedule</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="col-span-1 rounded-xl border border-border/40 p-3">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-foreground/50">Cafe option {idx + 1}</p>
                    <input value={cafes[idx].name} onChange={(e) => setCafes((prev) => prev.map((row, i) => i === idx ? { ...row, name: e.target.value } : row))} placeholder="Cafe name" className="mt-2 w-full bg-transparent border-b border-border/50 text-sm py-1" />
                    <input value={cafes[idx].address} onChange={(e) => setCafes((prev) => prev.map((row, i) => i === idx ? { ...row, address: e.target.value } : row))} placeholder="Address" className="mt-2 w-full bg-transparent border-b border-border/50 text-xs py-1" />
                  </div>
                ))}
                <div className="col-span-2 rounded-xl border border-border/40 p-3">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-foreground/50">Time slot options</p>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {timeSlots.map((slot, idx) => <input key={idx} value={slot} onChange={(e) => setTimeSlots((prev) => prev.map((value, i) => i === idx ? e.target.value : value))} placeholder="e.g. Saturday 7:30 PM" className="bg-transparent border-b border-border/50 text-xs py-1" />)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button disabled={busy === "send-options"} onClick={() => void withAction("send-options", async () => {
                  await sendOfflineMeetOptions(selected.id, {
                    cafes: cafes.map((entry, idx) => ({ id: makeOptionId("cafe", idx), name: entry.name, address: entry.address })),
                    timeSlots: timeSlots.map((entry, idx) => ({ id: makeOptionId("slot", idx), label: entry }))
                  });
                  setFeedback("Options sent to both members with a 12-hour deadline.");
                })} className="rounded-full border border-primary/40 px-3 py-1 text-xs uppercase tracking-[0.15em] text-primary">Send Options</button>

                <button disabled={busy === "finalize" || !selected.options.cafes[0] || !selected.options.timeSlots[0]} onClick={() => void withAction("finalize", async () => {
                  const cafeId = selected.options.cafes[0].id;
                  const slotId = selected.options.timeSlots[0].id;
                  await finalizeOfflineMeet(selected.id, cafeId, slotId);
                  setFeedback("Offline meet finalized and both members notified.");
                })} className="rounded-full border border-primary/40 px-3 py-1 text-xs uppercase tracking-[0.15em] text-primary">Finalize First Overlap</button>

                <button disabled={busy === "cancel"} onClick={() => void withAction("cancel", async () => {
                  await updateOfflineMeetCase(selected.id, { action: "CANCEL", reason: "Serious-condition cancellation handled by concierge." });
                  setFeedback("Case marked canceled.");
                })} className="rounded-full border border-red-400/40 px-3 py-1 text-xs uppercase tracking-[0.15em] text-red-300">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
