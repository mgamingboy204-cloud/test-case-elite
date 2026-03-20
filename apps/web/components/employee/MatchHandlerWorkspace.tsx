"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Loader2, RefreshCcw } from "lucide-react";
import { useLiveResourceRefresh } from "@/contexts/LiveUpdatesContext";
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

type OptionForm = {
  cafes: Array<{ id: string; name: string; address: string }>;
  timeSlots: Array<{ id: string; label: string }>;
};

const OFFLINE_VIEWS: Array<{ value: OfflineMeetStatusView; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "FINALIZED", label: "Finalized" },
  { value: "CONFLICT", label: "No overlap / conflict" },
  { value: "TIMEOUT", label: "Timeout" },
  { value: "CANCELED", label: "Canceled" },
  { value: "ALL", label: "All" }
];

const ONLINE_VIEWS: Array<{ value: OnlineMeetStatusView; label: string }> = OFFLINE_VIEWS as Array<{ value: OnlineMeetStatusView; label: string }>;

const activeStatuses = new Set([
  "ACCEPTED",
  "EMPLOYEE_PREPARING_OPTIONS",
  "OPTIONS_SENT",
  "AWAITING_USER_SELECTIONS",
  "USER_ONE_RESPONDED",
  "USER_TWO_RESPONDED",
  "READY_FOR_FINALIZATION",
  "RESCHEDULE_REQUESTED"
]);

function statusText(status: string) {
  return status.replaceAll("_", " ").toLowerCase();
}

function newDefaultOfflineOptions(): OptionForm {
  return {
    cafes: [
      { id: "cafe-1", name: "", address: "" },
      { id: "cafe-2", name: "", address: "" },
      { id: "cafe-3", name: "", address: "" }
    ],
    timeSlots: [
      { id: "slot-1", label: "" },
      { id: "slot-2", label: "" },
      { id: "slot-3", label: "" },
      { id: "slot-4", label: "" }
    ]
  };
}

function newDefaultOnlineOptions() {
  return {
    platforms: ["ZOOM", "GOOGLE_MEET"] as MeetPlatform[],
    timeSlots: [
      { id: "slot-1", label: "" },
      { id: "slot-2", label: "" },
      { id: "slot-3", label: "" },
      { id: "slot-4", label: "" }
    ],
    finalMeetingLink: ""
  };
}

export function MatchHandlerWorkspace() {
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

  const [offlineOptionsForm, setOfflineOptionsForm] = useState<OptionForm>(newDefaultOfflineOptions());
  const [onlineOptionsForm, setOnlineOptionsForm] = useState(newDefaultOnlineOptions());
  const [timeoutUserId, setTimeoutUserId] = useState<string | null>(null);

  const activeView = mode === "OFFLINE" ? offlineView : onlineView;
  const activeItems = mode === "OFFLINE" ? offlineCases : onlineCases;
  const selectedOffline = offlineCases.find((entry) => entry.id === selectedCaseId) ?? null;
  const selectedOnline = onlineCases.find((entry) => entry.id === selectedCaseId) ?? null;

  const offlineOverlap = useMemo(() => {
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

  const onlineOverlap = useMemo(() => {
    if (!selectedOnline) return { platform: null as MeetPlatform | null, slots: [] as Array<{ id: string; label: string }> };
    const sharedPlatform =
      selectedOnline.selections.requester.platform &&
      selectedOnline.selections.requester.platform === selectedOnline.selections.receiver.platform
        ? selectedOnline.selections.requester.platform
        : null;

    const requesterSlots = new Set(selectedOnline.selections.requester.timeSlots);
    const receiverSlots = new Set(selectedOnline.selections.receiver.timeSlots);

    return {
      platform: sharedPlatform,
      slots: selectedOnline.options.timeSlots.filter((entry) => requesterSlots.has(entry.id) && receiverSlots.has(entry.id))
    };
  }, [selectedOnline]);

  const loadCases = useCallback(async (targetMode: MeetMode, view = targetMode === "OFFLINE" ? offlineView : onlineView) => {
    if (targetMode === "OFFLINE") {
      const payload = await listOfflineMeetCasesForEmployee(view as OfflineMeetStatusView);
      setOfflineCases(payload.cases);
      setSelectedCaseId((prev) => (prev && payload.cases.some((item) => item.id === prev) ? prev : payload.cases[0]?.id ?? null));
      return;
    }

    const payload = await listOnlineMeetCasesForEmployee(view as OnlineMeetStatusView);
    setOnlineCases(payload.cases);
    setSelectedCaseId((prev) => (prev && payload.cases.some((item) => item.id === prev) ? prev : payload.cases[0]?.id ?? null));
  }, [offlineView, onlineView]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        await loadCases(mode, activeView);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load coordination desk.");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [activeView, loadCases, mode]);

  useEffect(() => {
    setFeedback(null);
    setError(null);

    if (selectedOffline) {
      setTimeoutUserId(selectedOffline.users[0]?.id ?? null);
      setOfflineOptionsForm({
        cafes:
          selectedOffline.options.cafes.length > 0
            ? selectedOffline.options.cafes.map((entry, idx) => ({ id: entry.id || `cafe-${idx + 1}`, name: entry.name, address: entry.address }))
            : newDefaultOfflineOptions().cafes,
        timeSlots:
          selectedOffline.options.timeSlots.length > 0
            ? selectedOffline.options.timeSlots.map((entry, idx) => ({ id: entry.id || `slot-${idx + 1}`, label: entry.label }))
            : newDefaultOfflineOptions().timeSlots
      });
      return;
    }

    if (selectedOnline) {
      setTimeoutUserId(selectedOnline.users[0]?.id ?? null);
      setOnlineOptionsForm({
        platforms: selectedOnline.options.platforms.length > 0 ? selectedOnline.options.platforms : ["ZOOM", "GOOGLE_MEET"],
        timeSlots:
          selectedOnline.options.timeSlots.length > 0
            ? selectedOnline.options.timeSlots.map((entry, idx) => ({ id: entry.id || `slot-${idx + 1}`, label: entry.label }))
            : newDefaultOnlineOptions().timeSlots,
        finalMeetingLink: selectedOnline.finalMeetingLink ?? ""
      });
    }
  }, [selectedOffline, selectedOnline]);

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

  useLiveResourceRefresh({
    enabled: true,
    refresh: refreshActive,
    eventTypes: ["admin.offline_meets.changed", "admin.online_meets.changed"],
    fallbackIntervalMs: 60_000
  });

  const withAction = async (key: string, run: () => Promise<unknown>, successMessage: string) => {
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

  const canAct = mode === "OFFLINE" ? Boolean(selectedOffline && activeStatuses.has(selectedOffline.status)) : Boolean(selectedOnline && activeStatuses.has(selectedOnline.status));

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-[#121826] p-6 text-white">
        <h1 className="text-2xl tracking-[0.2em] uppercase">Match Handler Desk</h1>
        <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Employee-managed offline / online coordination</p>
      </header>

      <div className="grid gap-4 md:grid-cols-[240px,1fr]">
        <aside className="rounded-2xl border border-white/10 bg-[#121826] p-4 text-white">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex gap-2">
              <button onClick={() => setMode("OFFLINE")} className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${mode === "OFFLINE" ? "border-primary bg-primary/20 text-primary" : "border-white/20 text-white/70"}`}>Offline</button>
              <button onClick={() => setMode("ONLINE")} className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${mode === "ONLINE" ? "border-highlight bg-highlight/20 text-highlight" : "border-white/20 text-white/70"}`}>Online</button>
            </div>
            <button onClick={() => void refreshActive()} className="rounded-full border border-white/20 p-2" aria-label="Refresh">
              {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCcw size={14} />}
            </button>
          </div>

          <select
            value={activeView}
            onChange={(event) => (mode === "OFFLINE" ? setOfflineView(event.target.value as OfflineMeetStatusView) : setOnlineView(event.target.value as OnlineMeetStatusView))}
            className="mb-3 w-full rounded-xl border border-white/20 bg-transparent px-3 py-2 text-xs"
          >
            {(mode === "OFFLINE" ? OFFLINE_VIEWS : ONLINE_VIEWS).map((entry) => (
              <option key={entry.value} value={entry.value} className="text-black">
                {entry.label}
              </option>
            ))}
          </select>

          <div className="space-y-2">
            {activeItems.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelectedCaseId(entry.id)}
                className={`w-full rounded-xl border p-2 text-left text-xs ${selectedCaseId === entry.id ? "border-primary/60 bg-primary/10" : "border-white/15"}`}
              >
                <p className="font-medium">{entry.users[0]?.name ?? "Member"} x {entry.users[1]?.name ?? "Member"}</p>
                <p className="mt-1 uppercase tracking-[0.12em] text-[10px] text-white/50">{statusText(entry.status)}</p>
              </button>
            ))}
            {!loading && activeItems.length === 0 ? <p className="text-xs text-white/55">No cases in this view.</p> : null}
          </div>
        </aside>

        <section className="rounded-2xl border border-white/10 bg-[#121826] p-5 text-white">
          {loading ? (
            <div className="flex items-center gap-2 text-white/65"><Loader2 size={16} className="animate-spin" /> Loading...</div>
          ) : mode === "OFFLINE" && selectedOffline ? (
            <div className="space-y-4">
              <DeskSummary
                title="Offline meet case"
                status={selectedOffline.status}
                assignedEmployeeId={selectedOffline.assignedEmployeeId}
                responseDeadlineAt={selectedOffline.responseDeadlineAt}
                cooldownUntil={selectedOffline.cooldownUntil}
                users={selectedOffline.users}
              />

              <ActionBar disabled={!canAct}>
                <button disabled={busyAction === "assign-offline"} onClick={() => void withAction("assign-offline", async () => {
                  await assignOfflineMeetCase(selectedOffline.id);
                }, "Case assigned.")}>Assign to me</button>
                <button disabled={busyAction === "timeout-offline" || !timeoutUserId} onClick={() => void withAction("timeout-offline", async () => {
                  await markOfflineMeetTimeout(selectedOffline.id, timeoutUserId ?? "");
                }, "Timeout recorded.")}>Mark timeout</button>
                <button disabled={busyAction === "no-overlap-offline"} onClick={() => void withAction("no-overlap-offline", async () => {
                  await markOfflineMeetNoOverlap(selectedOffline.id);
                }, "No-overlap recorded.")}>Mark no overlap</button>
                <button disabled={busyAction === "reschedule-offline"} onClick={() => void withAction("reschedule-offline", async () => {
                  await updateOfflineMeetCase(selectedOffline.id, { action: "RESCHEDULE", reason: "Serious-condition reschedule handled by concierge." });
                }, "Reschedule recorded.")}>Reschedule</button>
                <button disabled={busyAction === "cancel-offline"} onClick={() => void withAction("cancel-offline", async () => {
                  await updateOfflineMeetCase(selectedOffline.id, { action: "CANCEL", reason: "Serious-condition cancellation handled by concierge." });
                }, "Case canceled.")}>Cancel</button>
              </ActionBar>

              <MemberSelectionBlock users={selectedOffline.users} timeoutUserId={timeoutUserId} setTimeoutUserId={setTimeoutUserId} />

              <OptionsEditor
                cafes={offlineOptionsForm.cafes}
                timeSlots={offlineOptionsForm.timeSlots}
                onCafeChange={(idx, key, value) => setOfflineOptionsForm((prev) => ({ ...prev, cafes: prev.cafes.map((item, itemIdx) => (itemIdx === idx ? { ...item, [key]: value } : item)) }))}
                onSlotChange={(idx, value) => setOfflineOptionsForm((prev) => ({ ...prev, timeSlots: prev.timeSlots.map((item, itemIdx) => (itemIdx === idx ? { ...item, label: value } : item)) }))}
                theme="primary"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-primary/45 px-3 py-1 text-xs uppercase tracking-[0.14em] text-primary"
                  onClick={() =>
                    void withAction(
                      "send-options-offline",
                      async () => {
                        const cafes = offlineOptionsForm.cafes.filter((entry) => entry.name.trim() && entry.address.trim());
                        const timeSlots = offlineOptionsForm.timeSlots.filter((entry) => entry.label.trim());
                        if (cafes.length !== 3 || timeSlots.length < 3) {
                          throw new ApiError("Provide exactly 3 cafes and at least 3 time slots before sending options.", 400, null);
                        }
                        await sendOfflineMeetOptions(selectedOffline.id, { cafes, timeSlots });
                      },
                      "Options sent to both members."
                    )
                  }
                >
                  Send options
                </button>
                <button
                  className="rounded-full border border-primary/45 px-3 py-1 text-xs uppercase tracking-[0.14em] text-primary"
                  onClick={() =>
                    void withAction(
                      "finalize-offline",
                      async () => {
                        const cafe = offlineOverlap.cafes[0];
                        const slot = offlineOverlap.slots[0];
                        if (!cafe || !slot) throw new ApiError("No shared overlap available yet.", 409, null);
                        await finalizeOfflineMeet(selectedOffline.id, cafe.id, slot.id);
                      },
                      "Offline meet finalized and members notified."
                    )
                  }
                >
                  Finalize overlap
                </button>
              </div>

              <OverlapSummary
                overlapItems={[
                  `Shared cafes: ${offlineOverlap.cafes.map((entry) => entry.name).join(", ") || "none"}`,
                  `Shared time slots: ${offlineOverlap.slots.map((entry) => entry.label).join(", ") || "none"}`
                ]}
              />
            </div>
          ) : mode === "ONLINE" && selectedOnline ? (
            <div className="space-y-4">
              <DeskSummary
                title="Online meet case"
                status={selectedOnline.status}
                assignedEmployeeId={selectedOnline.assignedEmployeeId}
                responseDeadlineAt={selectedOnline.responseDeadlineAt}
                cooldownUntil={selectedOnline.cooldownUntil}
                users={selectedOnline.users}
              />

              <ActionBar disabled={!canAct}>
                <button disabled={busyAction === "assign-online"} onClick={() => void withAction("assign-online", async () => {
                  await assignOnlineMeetCase(selectedOnline.id);
                }, "Case assigned.")}>Assign to me</button>
                <button disabled={busyAction === "timeout-online" || !timeoutUserId} onClick={() => void withAction("timeout-online", async () => {
                  await markOnlineMeetTimeout(selectedOnline.id, timeoutUserId ?? "");
                }, "Timeout recorded.")}>Mark timeout</button>
                <button disabled={busyAction === "no-overlap-online"} onClick={() => void withAction("no-overlap-online", async () => {
                  await markOnlineMeetNoOverlap(selectedOnline.id);
                }, "No-overlap recorded.")}>Mark no overlap</button>
                <button disabled={busyAction === "reschedule-online"} onClick={() => void withAction("reschedule-online", async () => {
                  await updateOnlineMeetCase(selectedOnline.id, { action: "RESCHEDULE", reason: "Serious-condition reschedule handled by concierge." });
                }, "Reschedule recorded.")}>Reschedule</button>
                <button disabled={busyAction === "cancel-online"} onClick={() => void withAction("cancel-online", async () => {
                  await updateOnlineMeetCase(selectedOnline.id, { action: "CANCEL", reason: "Serious-condition cancellation handled by concierge." });
                }, "Case canceled.")}>Cancel</button>
              </ActionBar>

              <MemberSelectionBlock users={selectedOnline.users} timeoutUserId={timeoutUserId} setTimeoutUserId={setTimeoutUserId} />

              <div className="rounded-xl border border-highlight/30 p-3">
                <p className="text-[10px] uppercase tracking-[0.14em] text-highlight">Platforms</p>
                <div className="mt-2 flex gap-2">
                  {(["ZOOM", "GOOGLE_MEET"] as MeetPlatform[]).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setOnlineOptionsForm((prev) => ({ ...prev, platforms: prev.platforms.includes(platform) ? prev.platforms.filter((entry) => entry !== platform) : [...prev.platforms, platform] }))}
                      className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${onlineOptionsForm.platforms.includes(platform) ? "border-highlight/60 bg-highlight/10" : "border-white/20"}`}
                    >
                      {platform.replace("_", " ")}
                    </button>
                  ))}
                </div>

                <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-highlight">Time slots</p>
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {onlineOptionsForm.timeSlots.map((slot, idx) => (
                    <input
                      key={slot.id}
                      value={slot.label}
                      onChange={(event) => setOnlineOptionsForm((prev) => ({ ...prev, timeSlots: prev.timeSlots.map((item, itemIdx) => (itemIdx === idx ? { ...item, label: event.target.value } : item)) }))}
                      placeholder="Wed 7:30 PM"
                      className="border-b border-white/20 bg-transparent py-1 text-xs"
                    />
                  ))}
                </div>

                <input
                  value={onlineOptionsForm.finalMeetingLink}
                  onChange={(event) => setOnlineOptionsForm((prev) => ({ ...prev, finalMeetingLink: event.target.value }))}
                  placeholder="Final meeting link (https://...)"
                  className="mt-3 w-full border-b border-white/20 bg-transparent py-1 text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-full border border-highlight/45 px-3 py-1 text-xs uppercase tracking-[0.14em] text-highlight"
                  onClick={() =>
                    void withAction(
                      "send-options-online",
                      async () => {
                        const timeSlots = onlineOptionsForm.timeSlots.filter((entry) => entry.label.trim());
                        if (onlineOptionsForm.platforms.length === 0 || timeSlots.length < 3) {
                          throw new ApiError("Select at least one platform and 3 time slots before sending options.", 400, null);
                        }
                        await sendOnlineMeetOptions(selectedOnline.id, { platforms: onlineOptionsForm.platforms, timeSlots });
                      },
                      "Platform/time options sent."
                    )
                  }
                >
                  Send options
                </button>

                <button
                  className="rounded-full border border-highlight/45 px-3 py-1 text-xs uppercase tracking-[0.14em] text-highlight"
                  onClick={() =>
                    void withAction(
                      "finalize-online",
                      async () => {
                        const slot = onlineOverlap.slots[0];
                        if (!onlineOverlap.platform || !slot) throw new ApiError("No shared overlap available yet.", 409, null);
                        if (!onlineOptionsForm.finalMeetingLink.trim()) throw new ApiError("Final meeting link is required.", 400, null);
                        await finalizeOnlineMeet(selectedOnline.id, {
                          finalPlatform: onlineOverlap.platform,
                          finalTimeSlotId: slot.id,
                          finalMeetingLink: onlineOptionsForm.finalMeetingLink.trim()
                        });
                      },
                      "Online meet finalized and members notified."
                    )
                  }
                >
                  Finalize overlap
                </button>
              </div>

              <OverlapSummary
                overlapItems={[
                  `Shared platform: ${onlineOverlap.platform ? onlineOverlap.platform.replace("_", " ") : "none"}`,
                  `Shared time slots: ${onlineOverlap.slots.map((entry) => entry.label).join(", ") || "none"}`
                ]}
              />
            </div>
          ) : (
            <p className="text-sm text-white/65">Select a case to view details.</p>
          )}

          {feedback ? <p className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100">{feedback}</p> : null}
          {error ? <p className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs text-red-100">{error}</p> : null}
        </section>
      </div>
    </div>
  );
}

function DeskSummary(props: {
  title: string;
  status: string;
  assignedEmployeeId: string | null;
  responseDeadlineAt: string | null;
  cooldownUntil: string | null;
  users: Array<{ id: string; name: string; locationLabel: string; city: string | null; profession: string | null }>;
}) {
  return (
    <div className="rounded-xl border border-white/15 p-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-white/50">{props.title}</p>
      <p className="mt-2 text-sm text-white/85">Status: <span className="uppercase tracking-[0.12em]">{statusText(props.status)}</span></p>
      <p className="text-xs text-white/60">Assigned employee: {props.assignedEmployeeId ?? "unassigned"}</p>
      {props.responseDeadlineAt ? <p className="text-xs text-white/60">Deadline: {new Date(props.responseDeadlineAt).toLocaleString()}</p> : null}
      {props.cooldownUntil ? <p className="text-xs text-white/60">Cooldown: {new Date(props.cooldownUntil).toLocaleString()}</p> : null}

      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {props.users.map((member) => (
          <div key={member.id} className="rounded-lg border border-white/10 p-2 text-xs">
            <p className="font-medium">{member.name}</p>
            <p className="text-white/60">{member.locationLabel}</p>
            {member.profession ? <p className="text-white/50">{member.profession}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionBar({ disabled, children }: { disabled: boolean; children: ReactNode }) {
  return (
    <div className="flex flex-wrap gap-2 [&>button]:rounded-full [&>button]:border [&>button]:border-white/20 [&>button]:px-3 [&>button]:py-1 [&>button]:text-xs [&>button]:uppercase [&>button]:tracking-[0.14em] [&>button]:disabled:opacity-45">
      {disabled ? <p className="w-full text-[11px] uppercase tracking-[0.15em] text-white/45">Case is not in active desk state.</p> : null}
      {children}
    </div>
  );
}

function MemberSelectionBlock(props: {
  users: Array<{ id: string; name: string }>;
  timeoutUserId: string | null;
  setTimeoutUserId: (value: string) => void;
}) {
  return (
    <div className="rounded-xl border border-white/15 p-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/55">Timeout target member</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {props.users.map((member) => (
          <button
            key={member.id}
            onClick={() => props.setTimeoutUserId(member.id)}
            className={`rounded-full border px-3 py-1 text-xs ${props.timeoutUserId === member.id ? "border-primary/60 bg-primary/15" : "border-white/20"}`}
          >
            {member.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function OptionsEditor(props: {
  cafes: Array<{ id: string; name: string; address: string }>;
  timeSlots: Array<{ id: string; label: string }>;
  onCafeChange: (idx: number, key: "name" | "address", value: string) => void;
  onSlotChange: (idx: number, value: string) => void;
  theme: "primary" | "highlight";
}) {
  return (
    <div className="rounded-xl border border-primary/30 p-3">
      <p className={`text-[10px] uppercase tracking-[0.14em] ${props.theme === "primary" ? "text-primary" : "text-highlight"}`}>Curated cafe options (exactly 3)</p>
      <div className="mt-2 grid gap-2 md:grid-cols-3">
        {props.cafes.map((cafe, idx) => (
          <div key={cafe.id} className="rounded-lg border border-white/15 p-2">
            <input value={cafe.name} onChange={(event) => props.onCafeChange(idx, "name", event.target.value)} placeholder={`Cafe ${idx + 1} name`} className="w-full border-b border-white/20 bg-transparent py-1 text-xs" />
            <input value={cafe.address} onChange={(event) => props.onCafeChange(idx, "address", event.target.value)} placeholder="Address" className="mt-2 w-full border-b border-white/20 bg-transparent py-1 text-xs" />
          </div>
        ))}
      </div>

      <p className={`mt-3 text-[10px] uppercase tracking-[0.14em] ${props.theme === "primary" ? "text-primary" : "text-highlight"}`}>Time slots (minimum 3)</p>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {props.timeSlots.map((slot, idx) => (
          <input key={slot.id} value={slot.label} onChange={(event) => props.onSlotChange(idx, event.target.value)} placeholder="Tue 8:00 PM" className="border-b border-white/20 bg-transparent py-1 text-xs" />
        ))}
      </div>
    </div>
  );
}

function OverlapSummary({ overlapItems }: { overlapItems: string[] }) {
  return (
    <div className="rounded-xl border border-white/15 p-3 text-xs text-white/70">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/45">Overlap insight</p>
      <ul className="mt-2 space-y-1 list-disc pl-4">
        {overlapItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default MatchHandlerWorkspace;
