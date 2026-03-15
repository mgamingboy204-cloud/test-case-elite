"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import {
  assignOfflineMeetCase,
  finalizeOfflineMeet,
  listOfflineMeetCasesForEmployee,
  markOfflineMeetNoOverlap,
  markOfflineMeetTimeout,
  sendOfflineMeetOptions,
  updateOfflineMeetCase,
  type OfflineMeetEmployeeCase,
  type OfflineMeetStatusView
} from "@/lib/offlineMeet";
import {
  assignOnlineMeetCase,
  finalizeOnlineMeet,
  listOnlineMeetCasesForEmployee,
  markOnlineMeetNoOverlap,
  markOnlineMeetTimeout,
  sendOnlineMeetOptions,
  updateOnlineMeetCase,
  type MeetPlatform,
  type OnlineMeetEmployeeCase,
  type OnlineMeetStatusView
} from "@/lib/onlineMeet";
import { ApiError } from "@/lib/api";

type MeetMode = "OFFLINE" | "ONLINE";

const OFFLINE_VIEWS: Array<{ value: OfflineMeetStatusView; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "FINALIZED", label: "Finalized" },
  { value: "CONFLICT", label: "No overlap / conflict" },
  { value: "TIMEOUT", label: "Timeout" },
  { value: "CANCELED", label: "Canceled" }
];

const ONLINE_VIEWS: Array<{ value: OnlineMeetStatusView; label: string }> = OFFLINE_VIEWS as Array<{ value: OnlineMeetStatusView; label: string }>;

function makeOptionId(prefix: string, idx: number) {
  return `${prefix}-${idx + 1}`;
}

export default function AgentWorkspace() {
  const [mode, setMode] = useState<MeetMode>("OFFLINE");
  const [offlineView, setOfflineView] = useState<OfflineMeetStatusView>("ACTIVE");
  const [onlineView, setOnlineView] = useState<OnlineMeetStatusView>("ACTIVE");
  const [offlineCases, setOfflineCases] = useState<OfflineMeetEmployeeCase[]>([]);
  const [onlineCases, setOnlineCases] = useState<OnlineMeetEmployeeCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [cafes, setCafes] = useState([{ name: "", address: "" }, { name: "", address: "" }, { name: "", address: "" }]);
  const [offlineTimeSlots, setOfflineTimeSlots] = useState(["", "", ""]);
  const [platforms, setPlatforms] = useState<MeetPlatform[]>(["ZOOM", "GOOGLE_MEET"]);
  const [onlineTimeSlots, setOnlineTimeSlots] = useState(["", "", ""]);
  const [finalOnlineLink, setFinalOnlineLink] = useState("");

  const activeView = mode === "OFFLINE" ? offlineView : onlineView;
  const activeItems = mode === "OFFLINE" ? offlineCases : onlineCases;
  const selectedOffline = offlineCases.find((entry) => entry.id === selectedCaseId) ?? null;
  const selectedOnline = onlineCases.find((entry) => entry.id === selectedCaseId) ?? null;
  const selectedAny = mode === "OFFLINE" ? selectedOffline : selectedOnline;

  const loadCases = async (targetMode: MeetMode, view = targetMode === "OFFLINE" ? offlineView : onlineView) => {
    if (targetMode === "OFFLINE") {
      const payload = await listOfflineMeetCasesForEmployee(view as OfflineMeetStatusView);
      setOfflineCases(payload.cases);
      setSelectedCaseId((prev) => (prev && payload.cases.some((item) => item.id === prev) ? prev : payload.cases[0]?.id ?? null));
      return;
    }
    const payload = await listOnlineMeetCasesForEmployee(view as OnlineMeetStatusView);
    setOnlineCases(payload.cases);
    setSelectedCaseId((prev) => (prev && payload.cases.some((item) => item.id === prev) ? prev : payload.cases[0]?.id ?? null));
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadCases(mode, activeView);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load meet coordination queue.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [mode, activeView]);

  const refreshActive = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await loadCases(mode, activeView);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to refresh queue.");
    } finally {
      setRefreshing(false);
    }
  };

  const withAction = async (key: string, run: () => Promise<void>, successMessage: string) => {
    setBusyAction(key);
    setFeedback(null);
    setError(null);
    try {
      await run();
      await refreshActive();
      setFeedback(successMessage);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Operation failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const offlineCandidateChoices = useMemo(() => {
    if (!selectedOffline) return { cafes: [], slots: [] };
    const requesterCafe = new Set(selectedOffline.selections.requester.cafes);
    const receiverCafe = new Set(selectedOffline.selections.receiver.cafes);
    const requesterSlots = new Set(selectedOffline.selections.requester.timeSlots);
    const receiverSlots = new Set(selectedOffline.selections.receiver.timeSlots);
    return {
      cafes: selectedOffline.options.cafes.filter((entry) => requesterCafe.has(entry.id) && receiverCafe.has(entry.id)),
      slots: selectedOffline.options.timeSlots.filter((entry) => requesterSlots.has(entry.id) && receiverSlots.has(entry.id))
    };
  }, [selectedOffline]);

  const onlineCandidateChoices = useMemo(() => {
    if (!selectedOnline) return { platform: null as MeetPlatform | null, slots: [] as Array<{ id: string; label: string }> };
    const sharedPlatform = selectedOnline.selections.requester.platform && selectedOnline.selections.requester.platform === selectedOnline.selections.receiver.platform
      ? selectedOnline.selections.requester.platform
      : null;
    const requesterSlots = new Set(selectedOnline.selections.requester.timeSlots);
    const receiverSlots = new Set(selectedOnline.selections.receiver.timeSlots);
    return {
      platform: sharedPlatform,
      slots: selectedOnline.options.timeSlots.filter((entry) => requesterSlots.has(entry.id) && receiverSlots.has(entry.id))
    };
  }, [selectedOnline]);

  return (
    <div className="p-8 text-white space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl tracking-[0.2em] uppercase">Match Handler Desk</h1>
          <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Employee-managed online/offline meet coordination</p>
        </div>
        <button
          onClick={() => void refreshActive()}
          className="inline-flex items-center gap-2 rounded-full border border-[#2a2f3b] px-3 py-1.5 text-[11px] uppercase tracking-[0.16em]"
        >
          {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCcw size={13} />} Refresh
        </button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setMode("OFFLINE"); setSelectedCaseId(null); }} className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] ${mode === "OFFLINE" ? "border-primary/45 bg-primary/10" : "border-[#2a2f3b]"}`}>Offline meet cases</button>
        <button onClick={() => { setMode("ONLINE"); setSelectedCaseId(null); }} className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.16em] ${mode === "ONLINE" ? "border-highlight/45 bg-highlight/10" : "border-[#2a2f3b]"}`}>Online meet cases</button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(mode === "OFFLINE" ? OFFLINE_VIEWS : ONLINE_VIEWS).map((item) => (
          <button
            key={item.value}
            onClick={() => {
              setSelectedCaseId(null);
              if (mode === "OFFLINE") setOfflineView(item.value as OfflineMeetStatusView);
              else setOnlineView(item.value as OnlineMeetStatusView);
            }}
            className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em] ${activeView === item.value ? "border-[#C89B90]/45 bg-[#C89B90]/10 text-[#f0c8be]" : "border-[#2a2f3b] text-white/70"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {feedback ? <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">{feedback}</div> : null}
      {error ? <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-300">{error}</div> : null}

      {loading ? (
        <div className="rounded-xl border border-[#1f222b] bg-[#0d1016] p-6 text-sm text-white/65 inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Loading coordination cases…
        </div>
      ) : activeItems.length === 0 ? (
        <div className="rounded-xl border border-[#1f222b] bg-[#0d1016] p-8 text-sm text-white/60">No cases in this state.</div>
      ) : (
        <div className="grid grid-cols-12 gap-5">
          <aside className="col-span-4 rounded-xl border border-[#1f222b] bg-[#0d1016] p-3 space-y-2 max-h-[70vh] overflow-y-auto">
            {activeItems.map((item) => (
              <button key={item.id} onClick={() => setSelectedCaseId(item.id)} className={`w-full text-left rounded-lg border p-3 ${selectedCaseId === item.id ? "border-[#C89B90]/45 bg-[#C89B90]/10" : "border-[#2a2f3b]"}`}>
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/55">{item.status.replaceAll("_", " ")}</p>
                <p className="mt-1 text-sm">{item.users[0]?.name} × {item.users[1]?.name}</p>
                <p className="mt-1 text-[11px] text-white/50">{item.users[0]?.locationLabel} • {item.users[1]?.locationLabel}</p>
                <p className="mt-1 text-[10px] text-white/40">{item.assignedEmployeeId ? "Assigned" : "Unassigned"}</p>
              </button>
            ))}
          </aside>

          <section className="col-span-8 rounded-xl border border-[#1f222b] bg-[#0d1016] p-6">
            {!selectedAny ? (
              <p className="text-sm text-white/60">Select a case to continue concierge coordination.</p>
            ) : mode === "OFFLINE" && selectedOffline ? (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary">{selectedOffline.status.replaceAll("_", " ")}</p>
                <h2 className="text-xl">{selectedOffline.users[0]?.name} × {selectedOffline.users[1]?.name}</h2>
                <div className="rounded-xl border border-[#2a2f3b] p-3 text-xs text-white/65">Offline meets remain employee-managed. Use this panel for options, overlap handling, finalization, and serious-condition cancel/reschedule actions.</div>

                <div className="flex flex-wrap gap-2">
                  <button disabled={busyAction === "assign-offline"} onClick={() => void withAction("assign-offline", async () => { await assignOfflineMeetCase(selectedOffline.id); }, "Case assigned to you.")} className="rounded-full border border-[#2a2f3b] px-3 py-1 text-xs uppercase tracking-[0.14em] disabled:opacity-45">Assign</button>
                  <button disabled={busyAction === "timeout-offline"} onClick={() => void withAction("timeout-offline", async () => { await markOfflineMeetTimeout(selectedOffline.id, selectedOffline.users[1]?.id ?? ""); }, "No-response recorded.")} className="rounded-full border border-[#2a2f3b] px-3 py-1 text-xs uppercase tracking-[0.14em] disabled:opacity-45">Mark timeout</button>
                  <button disabled={busyAction === "no-overlap-offline"} onClick={() => void withAction("no-overlap-offline", async () => { await markOfflineMeetNoOverlap(selectedOffline.id); }, "No-overlap status recorded.")} className="rounded-full border border-[#2a2f3b] px-3 py-1 text-xs uppercase tracking-[0.14em] disabled:opacity-45">Mark no overlap</button>
                  <button disabled={busyAction === "reschedule-offline"} onClick={() => void withAction("reschedule-offline", async () => { await updateOfflineMeetCase(selectedOffline.id, { action: "RESCHEDULE", reason: "Serious-condition reschedule request handled by concierge." }); }, "Reschedule request logged.")} className="rounded-full border border-[#2a2f3b] px-3 py-1 text-xs uppercase tracking-[0.14em] disabled:opacity-45">Reschedule</button>
                  <button disabled={busyAction === "cancel-offline"} onClick={() => void withAction("cancel-offline", async () => { await updateOfflineMeetCase(selectedOffline.id, { action: "CANCEL", reason: "Serious-condition cancellation handled by concierge." }); }, "Case canceled.")} className="rounded-full border border-red-500/45 px-3 py-1 text-xs uppercase tracking-[0.14em] text-red-300 disabled:opacity-45">Cancel</button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {cafes.map((entry, idx) => (
                    <div key={`cafe-${idx}`} className="space-y-2 rounded-xl border border-[#2a2f3b] p-3">
                      <input value={entry.name} onChange={(event) => setCafes((prev) => prev.map((row, rowIdx) => rowIdx === idx ? { ...row, name: event.target.value } : row))} placeholder="Cafe name" className="w-full bg-transparent border-b border-[#2a2f3b] text-xs py-1" />
                      <input value={entry.address} onChange={(event) => setCafes((prev) => prev.map((row, rowIdx) => rowIdx === idx ? { ...row, address: event.target.value } : row))} placeholder="Address" className="w-full bg-transparent border-b border-[#2a2f3b] text-xs py-1" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {offlineTimeSlots.map((slot, idx) => (
                    <input key={`slot-${idx}`} value={slot} onChange={(event) => setOfflineTimeSlots((prev) => prev.map((item, itemIdx) => itemIdx === idx ? event.target.value : item))} placeholder="Time slot" className="bg-transparent border-b border-[#2a2f3b] text-xs py-1" />
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => void withAction("send-options-offline", async () => { await sendOfflineMeetOptions(selectedOffline.id, { cafes: cafes.map((entry, idx) => ({ id: makeOptionId("cafe", idx), name: entry.name.trim(), address: entry.address.trim() })), timeSlots: offlineTimeSlots.map((entry, idx) => ({ id: makeOptionId("slot", idx), label: entry.trim() })) }); }, "Curated cafe and time options sent to members.")} className="rounded-full border border-primary/45 px-3 py-1 text-xs uppercase tracking-[0.14em] text-primary">Send options</button>
                  <button
                    onClick={() => void withAction("finalize-offline", async () => {
                      const firstCafe = offlineCandidateChoices.cafes[0];
                      const firstSlot = offlineCandidateChoices.slots[0];
                      if (!firstCafe || !firstSlot) {
                        throw new ApiError("No overlapping selections available to finalize.", 409, null);
                      }
                      await finalizeOfflineMeet(selectedOffline.id, firstCafe.id, firstSlot.id);
                    }, "Offline meeting finalized and members notified.")}
                    className="rounded-full border border-primary/45 px-3 py-1 text-xs uppercase tracking-[0.14em] text-primary"
                  >
                    Finalize overlap
                  </button>
                </div>
              </div>
            ) : selectedOnline ? (
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-highlight">{selectedOnline.status.replaceAll("_", " ")}</p>
                <h2 className="text-xl">{selectedOnline.users[0]?.name} × {selectedOnline.users[1]?.name}</h2>
                <div className="rounded-xl border border-[#2a2f3b] p-3 text-xs text-white/65">Online coordination is worker-led. Keep options curated, resolve overlap, and finalize meeting details cleanly.</div>

                <div className="flex flex-wrap gap-2">
                  <button disabled={busyAction === "assign-online"} onClick={() => void withAction("assign-online", async () => { await assignOnlineMeetCase(selectedOnline.id); }, "Case assigned to you.")} className="rounded-full border border-[#2a2f3b] px-3 py-1 text-xs uppercase tracking-[0.14em] disabled:opacity-45">Assign</button>
                  <button disabled={busyAction === "timeout-online"} onClick={() => void withAction("timeout-online", async () => { await markOnlineMeetTimeout(selectedOnline.id, selectedOnline.users[1]?.id ?? ""); }, "No-response recorded.")} className="rounded-full border border-[#2a2f3b] px-3 py-1 text-xs uppercase tracking-[0.14em] disabled:opacity-45">Mark timeout</button>
                  <button disabled={busyAction === "no-overlap-online"} onClick={() => void withAction("no-overlap-online", async () => { await markOnlineMeetNoOverlap(selectedOnline.id); }, "No-overlap status recorded.")} className="rounded-full border border-[#2a2f3b] px-3 py-1 text-xs uppercase tracking-[0.14em] disabled:opacity-45">Mark no overlap</button>
                  <button disabled={busyAction === "reschedule-online"} onClick={() => void withAction("reschedule-online", async () => { await updateOnlineMeetCase(selectedOnline.id, { action: "RESCHEDULE", reason: "Serious-condition reschedule request handled by concierge." }); }, "Reschedule request logged.")} className="rounded-full border border-[#2a2f3b] px-3 py-1 text-xs uppercase tracking-[0.14em] disabled:opacity-45">Reschedule</button>
                  <button disabled={busyAction === "cancel-online"} onClick={() => void withAction("cancel-online", async () => { await updateOnlineMeetCase(selectedOnline.id, { action: "CANCEL", reason: "Serious-condition cancellation handled by concierge." }); }, "Case canceled.")} className="rounded-full border border-red-500/45 px-3 py-1 text-xs uppercase tracking-[0.14em] text-red-300 disabled:opacity-45">Cancel</button>
                </div>

                <div className="rounded-xl border border-[#2a2f3b] p-3">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Allowed platforms</p>
                  <div className="mt-2 flex gap-2">
                    {(["ZOOM", "GOOGLE_MEET"] as MeetPlatform[]).map((platform) => (
                      <button key={platform} onClick={() => setPlatforms((prev) => prev.includes(platform) ? prev.filter((entry) => entry !== platform) : [...prev, platform])} className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${platforms.includes(platform) ? "border-highlight/45 bg-highlight/10" : "border-[#2a2f3b]"}`}>{platform.replace("_", " ")}</button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {onlineTimeSlots.map((slot, idx) => (
                    <input key={`online-slot-${idx}`} value={slot} onChange={(event) => setOnlineTimeSlots((prev) => prev.map((entry, entryIdx) => entryIdx === idx ? event.target.value : entry))} placeholder="Time slot" className="bg-transparent border-b border-[#2a2f3b] text-xs py-1" />
                  ))}
                </div>
                <input value={finalOnlineLink} onChange={(event) => setFinalOnlineLink(event.target.value)} placeholder="Final meeting link (https://...)" className="w-full bg-transparent border-b border-[#2a2f3b] text-xs py-1" />

                <div className="flex gap-2">
                  <button onClick={() => void withAction("send-options-online", async () => { await sendOnlineMeetOptions(selectedOnline.id, { platforms, timeSlots: onlineTimeSlots.map((entry, idx) => ({ id: makeOptionId("slot", idx), label: entry.trim() })) }); }, "Platform and time options sent to members.")} className="rounded-full border border-highlight/45 px-3 py-1 text-xs uppercase tracking-[0.14em] text-highlight">Send options</button>
                  <button
                    onClick={() => void withAction("finalize-online", async () => {
                      const selectedPlatform = onlineCandidateChoices.platform;
                      const selectedSlot = onlineCandidateChoices.slots[0];
                      if (!selectedPlatform || !selectedSlot) {
                        throw new ApiError("No shared platform/time overlap is available yet.", 409, null);
                      }
                      await finalizeOnlineMeet(selectedOnline.id, {
                        finalPlatform: selectedPlatform,
                        finalTimeSlotId: selectedSlot.id,
                        finalMeetingLink: finalOnlineLink.trim()
                      });
                    }, "Online meeting finalized and details delivered.")}
                    className="rounded-full border border-highlight/45 px-3 py-1 text-xs uppercase tracking-[0.14em] text-highlight"
                  >
                    Finalize overlap
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
