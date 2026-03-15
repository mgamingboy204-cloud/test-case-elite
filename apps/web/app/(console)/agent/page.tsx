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
import {
  assignOnlineMeetCase,
  finalizeOnlineMeet,
  listOnlineMeetCasesForEmployee,
  markOnlineMeetNoOverlap,
  markOnlineMeetTimeout,
  sendOnlineMeetOptions,
  updateOnlineMeetCase,
  type MeetPlatform
} from "@/lib/onlineMeet";
import { useStaleWhileRevalidate } from "@/lib/cache";
import { ApiError } from "@/lib/api";

function makeOptionId(prefix: string, idx: number) {
  return `${prefix}-${idx + 1}`;
}

export default function AgentWorkspace() {
  const [mode, setMode] = useState<"OFFLINE" | "ONLINE">("OFFLINE");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [cafes, setCafes] = useState([{ name: "", address: "" }, { name: "", address: "" }, { name: "", address: "" }]);
  const [offlineTimeSlots, setOfflineTimeSlots] = useState(["", "", ""]);

  const [platforms, setPlatforms] = useState<MeetPlatform[]>(["ZOOM", "GOOGLE_MEET"]);
  const [onlineTimeSlots, setOnlineTimeSlots] = useState(["", "", ""]);
  const [finalOnlineLink, setFinalOnlineLink] = useState("");

  const offlineCasesQuery = useStaleWhileRevalidate({ key: "agent-offline-meets", fetcher: async () => (await listOfflineMeetCasesForEmployee()).cases, staleTimeMs: 30_000, enabled: true });
  const onlineCasesQuery = useStaleWhileRevalidate({ key: "agent-online-meets", fetcher: async () => (await listOnlineMeetCasesForEmployee()).cases, staleTimeMs: 30_000, enabled: true });

  const offlineItems = useMemo(() => offlineCasesQuery.data ?? [], [offlineCasesQuery.data]);
  const onlineItems = useMemo(() => onlineCasesQuery.data ?? [], [onlineCasesQuery.data]);
  const items = mode === "OFFLINE" ? offlineItems : onlineItems;
  const selectedOffline = offlineItems.find((entry) => entry.id === selectedCaseId) ?? null;
  const selectedOnline = onlineItems.find((entry) => entry.id === selectedCaseId) ?? null;

  const refreshActive = async () => {
    if (mode === "OFFLINE") await offlineCasesQuery.refresh(true);
    else await onlineCasesQuery.refresh(true);
  };

  const withAction = async (key: string, run: () => Promise<void>) => {
    setBusy(key);
    setFeedback(null);
    try {
      await run();
      await refreshActive();
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : "Operation failed.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-8 text-foreground">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl tracking-[0.2em] uppercase">Meet Concierge Desk</h1>
        <button onClick={() => void refreshActive()} className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] border border-border/40 rounded-full px-3 py-1.5">
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <button onClick={() => { setMode("OFFLINE"); setSelectedCaseId(null); }} className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] ${mode === "OFFLINE" ? "border-primary/40 bg-primary/10" : "border-border/40"}`}>Offline Meets</button>
        <button onClick={() => { setMode("ONLINE"); setSelectedCaseId(null); }} className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] ${mode === "ONLINE" ? "border-highlight/40 bg-highlight/10" : "border-border/40"}`}>Online Meets</button>
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
          {!((mode === "OFFLINE" ? offlineCasesQuery : onlineCasesQuery).isRefreshing) && items.length === 0 ? (
            <div className="rounded-xl border border-border/40 p-4 text-sm text-foreground/65">No active {mode.toLowerCase()} meet cases.</div>
          ) : null}
        </div>

        <div className="col-span-2 rounded-2xl border border-border/40 p-5">
          {(mode === "OFFLINE" ? !selectedOffline : !selectedOnline) ? (
            <p className="text-sm text-foreground/60">Select a case to manage concierge coordination.</p>
          ) : mode === "OFFLINE" ? (
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">{selectedOnline!.status.replaceAll("_", " ")}</p>
              <h2 className="text-xl">{selectedOnline!.users[0]?.name} × {selectedOnline!.users[1]?.name}</h2>
              <div className="flex gap-2 flex-wrap">
                <button disabled={busy === "assign"} onClick={() => void withAction("assign", async () => { await assignOfflineMeetCase(selectedOffline!.id); setFeedback("Case assigned to you."); })} className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.15em]">{busy === "assign" ? <Loader2 size={12} className="animate-spin inline" /> : "Assign"}</button>
                <button onClick={() => void withAction("no-overlap", async () => { await markOfflineMeetNoOverlap(selectedOffline!.id); setFeedback("No-overlap recorded with 1-day cooldown."); })} className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.15em]">Mark No Overlap</button>
                <button onClick={() => void withAction("timeout", async () => { await markOfflineMeetTimeout(selectedOffline!.id, selectedOffline!.users[1]?.id ?? ""); setFeedback("Timeout marked."); })} className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.15em]">Mark Timeout</button>
                <button onClick={() => void withAction("reschedule", async () => { await updateOfflineMeetCase(selectedOffline!.id, { action: "RESCHEDULE", reason: "Member requested reschedule for serious reason." }); setFeedback("Reschedule request recorded."); })} className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.15em]">Reschedule</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="rounded-xl border border-border/40 p-3">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-foreground/50">Cafe option {idx + 1}</p>
                    <input value={cafes[idx].name} onChange={(e) => setCafes((prev) => prev.map((row, i) => i === idx ? { ...row, name: e.target.value } : row))} placeholder="Cafe name" className="mt-2 w-full bg-transparent border-b border-border/50 text-sm py-1" />
                    <input value={cafes[idx].address} onChange={(e) => setCafes((prev) => prev.map((row, i) => i === idx ? { ...row, address: e.target.value } : row))} placeholder="Address" className="mt-2 w-full bg-transparent border-b border-border/50 text-xs py-1" />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {offlineTimeSlots.map((slot, idx) => (
                  <input key={idx} value={slot} onChange={(e) => setOfflineTimeSlots((prev) => prev.map((v, i) => i === idx ? e.target.value : v))} placeholder="e.g. Saturday 7:30 PM" className="bg-transparent border-b border-border/50 text-xs py-1" />
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => void withAction("send-options", async () => { await sendOfflineMeetOptions(selectedOffline!.id, { cafes: cafes.map((entry, idx) => ({ id: makeOptionId("cafe", idx), name: entry.name, address: entry.address })), timeSlots: offlineTimeSlots.map((entry, idx) => ({ id: makeOptionId("slot", idx), label: entry })) }); setFeedback("Options sent to both members with a 12-hour deadline."); })} className="rounded-full border border-primary/40 px-3 py-1 text-xs uppercase tracking-[0.15em] text-primary">Send Options</button>
                <button onClick={() => void withAction("finalize", async () => { await finalizeOfflineMeet(selectedOffline!.id, selectedOffline!.options.cafes[0]?.id ?? "", selectedOffline!.options.timeSlots[0]?.id ?? ""); setFeedback("Offline meet finalized and both members notified."); })} className="rounded-full border border-primary/40 px-3 py-1 text-xs uppercase tracking-[0.15em] text-primary">Finalize First Overlap</button>
                <button onClick={() => void withAction("cancel", async () => { await updateOfflineMeetCase(selectedOffline!.id, { action: "CANCEL", reason: "Serious-condition cancellation handled by concierge." }); setFeedback("Case marked canceled."); })} className="rounded-full border border-red-400/40 px-3 py-1 text-xs uppercase tracking-[0.15em] text-red-300">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.2em] text-highlight">{selectedOnline!.status.replaceAll("_", " ")}</p>
              <h2 className="text-xl">{selectedOnline!.users[0]?.name} × {selectedOnline!.users[1]?.name}</h2>

              <div className="flex gap-2 flex-wrap">
                <button disabled={busy === "assign-online"} onClick={() => void withAction("assign-online", async () => { await assignOnlineMeetCase(selectedOnline!.id); setFeedback("Online meet case assigned to you."); })} className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.15em]">Assign</button>
                <button onClick={() => void withAction("no-overlap-online", async () => { await markOnlineMeetNoOverlap(selectedOnline!.id); setFeedback("No-overlap recorded with cooldown."); })} className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.15em]">Mark No Overlap</button>
                <button onClick={() => void withAction("timeout-online", async () => { await markOnlineMeetTimeout(selectedOnline!.id, selectedOnline!.users[1]?.id ?? ""); setFeedback("Timeout marked."); })} className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.15em]">Mark Timeout</button>
                <button onClick={() => void withAction("reschedule-online", async () => { await updateOnlineMeetCase(selectedOnline!.id, { action: "RESCHEDULE", reason: "Serious-condition reschedule request received." }); setFeedback("Reschedule request recorded."); })} className="rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.15em]">Reschedule</button>
              </div>

              <div className="rounded-xl border border-border/40 p-3">
                <p className="text-[11px] uppercase tracking-[0.15em] text-foreground/50">Allowed platforms</p>
                <div className="mt-2 flex gap-2">
                  {(["ZOOM", "GOOGLE_MEET"] as MeetPlatform[]).map((platform) => (
                    <button key={platform} onClick={() => setPlatforms((prev) => prev.includes(platform) ? prev.filter((item) => item !== platform) : [...prev, platform])} className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.12em] ${platforms.includes(platform) ? "border-highlight/50 bg-highlight/10" : "border-border/40"}`}>
                      {platform.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {onlineTimeSlots.map((slot, idx) => (
                  <input key={idx} value={slot} onChange={(e) => setOnlineTimeSlots((prev) => prev.map((v, i) => i === idx ? e.target.value : v))} placeholder="e.g. Saturday 9:00 PM" className="bg-transparent border-b border-border/50 text-xs py-1" />
                ))}
              </div>

              <input value={finalOnlineLink} onChange={(e) => setFinalOnlineLink(e.target.value)} placeholder="Final meeting link (Zoom/Meet URL)" className="w-full bg-transparent border-b border-border/50 text-xs py-1" />

              <div className="flex gap-3">
                <button onClick={() => void withAction("send-options-online", async () => { await sendOnlineMeetOptions(selectedOnline!.id, { platforms, timeSlots: onlineTimeSlots.map((entry, idx) => ({ id: makeOptionId("slot", idx), label: entry })) }); setFeedback("Online options sent to both members with a 12-hour response window."); })} className="rounded-full border border-highlight/40 px-3 py-1 text-xs uppercase tracking-[0.15em] text-highlight">Send Options</button>
                <button onClick={() => void withAction("finalize-online", async () => { await finalizeOnlineMeet(selectedOnline!.id, { finalPlatform: selectedOnline!.options.platforms[0] ?? "ZOOM", finalTimeSlotId: selectedOnline!.options.timeSlots[0]?.id ?? "", finalMeetingLink: finalOnlineLink }); setFeedback("Online meet finalized and details sent."); })} className="rounded-full border border-highlight/40 px-3 py-1 text-xs uppercase tracking-[0.15em] text-highlight">Finalize</button>
                <button onClick={() => void withAction("cancel-online", async () => { await updateOnlineMeetCase(selectedOnline!.id, { action: "CANCEL", reason: "Serious-condition cancellation handled by concierge." }); setFeedback("Online meet case marked canceled."); })} className="rounded-full border border-red-400/40 px-3 py-1 text-xs uppercase tracking-[0.15em] text-red-300">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
