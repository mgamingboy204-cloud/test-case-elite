import type { MeetPlatform } from "@/lib/onlineMeet";
import { useOfflineMeetOptions, useOnlineMeetOptions } from "@/features/matches/hooks/useMeetOptions";
import type { OfflineMeetDraft, OnlineMeetDraft } from "@/features/matches/types";

type OfflineMeetSelectionPanelProps = {
  matchId: string;
  pending: boolean;
  draft: OfflineMeetDraft;
  onToggleCafe: (matchId: string, cafeId: string) => void;
  onToggleSlot: (matchId: string, slotId: string) => void;
  onSubmit: (matchId: string) => Promise<void>;
};

export function OfflineMeetSelectionPanel(props: OfflineMeetSelectionPanelProps) {
  const { options, error } = useOfflineMeetOptions(props.matchId);

  return (
    <div className="mt-3 rounded-xl border border-primary/30 p-3">
      <p className="uppercase tracking-[0.15em] text-[10px] text-primary">Choose exactly 2 cafe options</p>
      <div className="mt-2 grid grid-cols-1 gap-2">
        {options.cafes.map((cafe) => (
          <button key={cafe.id} onClick={() => props.onToggleCafe(props.matchId, cafe.id)} className={`rounded-lg border px-3 py-2 text-left text-[10px] ${props.draft.cafes.includes(cafe.id) ? "border-primary bg-primary/10" : "border-border/40"}`}>
            <p className="uppercase tracking-[0.12em]">{cafe.name}</p>
            <p className="mt-1 text-foreground/60 normal-case tracking-normal">{cafe.address}</p>
          </button>
        ))}
      </div>

      <p className="mt-3 uppercase tracking-[0.15em] text-[10px] text-primary">Choose 3 to 4 time slots</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.timeSlots.map((slot) => (
          <button key={slot.id} onClick={() => props.onToggleSlot(props.matchId, slot.id)} className={`rounded-lg border px-2 py-2 text-left text-[10px] ${props.draft.timeSlots.includes(slot.id) ? "border-primary bg-primary/10" : "border-border/40"}`}>
            {slot.label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-2 text-[10px] text-red-400">{error}</p> : null}
      <button onClick={() => void props.onSubmit(props.matchId)} disabled={props.pending || options.cafes.length === 0 || options.timeSlots.length === 0} className="mt-3 rounded-full border border-primary/40 px-3 py-1.5 uppercase tracking-[0.14em] text-[10px] text-primary disabled:opacity-50">{props.pending ? "Submitting…" : "Submit concierge preferences"}</button>
    </div>
  );
}

type OnlineMeetSelectionPanelProps = {
  matchId: string;
  pending: boolean;
  draft: OnlineMeetDraft;
  onPlatformSelect: (matchId: string, platform: MeetPlatform) => void;
  onToggleSlot: (matchId: string, slotId: string) => void;
  onSubmit: (matchId: string) => Promise<void>;
};

export function OnlineMeetSelectionPanel(props: OnlineMeetSelectionPanelProps) {
  const { options, error } = useOnlineMeetOptions(props.matchId);

  return (
    <div className="mt-3 rounded-xl border border-highlight/30 p-3">
      <p className="uppercase tracking-[0.15em] text-[10px] text-highlight">Select platform</p>
      <div className="mt-2 flex gap-2">
        {options.platforms.map((platform) => (
          <button key={platform} onClick={() => props.onPlatformSelect(props.matchId, platform)} className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${props.draft.platform === platform ? "border-highlight bg-highlight/10" : "border-border/40"}`}>
            {platform.replace("_", " ")}
          </button>
        ))}
      </div>
      <p className="mt-3 uppercase tracking-[0.15em] text-[10px] text-highlight">Choose 2 to 4 time slots</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {options.timeSlots.map((slot) => (
          <button key={slot.id} onClick={() => props.onToggleSlot(props.matchId, slot.id)} className={`rounded-lg border px-2 py-2 text-left text-[10px] ${props.draft.timeSlots.includes(slot.id) ? "border-highlight bg-highlight/10" : "border-border/40"}`}>
            {slot.label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-[10px] text-red-400">{error}</p> : null}
      <button onClick={() => void props.onSubmit(props.matchId)} disabled={props.pending || options.platforms.length === 0 || options.timeSlots.length === 0} className="mt-3 rounded-full border border-highlight/40 px-3 py-1.5 uppercase tracking-[0.14em] text-[10px] text-highlight disabled:opacity-50">{props.pending ? "Submitting…" : "Submit online preferences"}</button>
    </div>
  );
}
