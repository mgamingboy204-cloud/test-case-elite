import { useState } from "react";
import { Phone } from "lucide-react";
import { ApiError } from "@/lib/api";
import { getPhoneUnlock, respondMatchConsent } from "@/lib/matches";
import type { PhoneExchangeCase } from "@/features/matches/types";

type PhoneExchangePanelProps = {
  matchId: string;
  currentUserId: string;
  phoneCase: PhoneExchangeCase;
  pending: boolean;
  onRequest: () => Promise<void>;
  onFeedback: (value: string) => void;
  onRefresh: () => Promise<void>;
  onActionStart: () => void;
  onActionEnd: () => void;
};

export function PhoneExchangePanel(props: PhoneExchangePanelProps) {
  const [revealedPhones, setRevealedPhones] = useState<Array<{ id: string; phone: string }> | null>(null);
  const mineIsRequester = props.phoneCase?.requesterUserId === props.currentUserId;

  const onRespond = async (response: "YES" | "NO") => {
    props.onActionStart();
    try {
      await respondMatchConsent({ matchId: props.matchId, type: "PHONE_NUMBER", response });
      await props.onRefresh();
      props.onFeedback(response === "YES" ? "Phone exchange accepted. Contact access is now available privately." : "Phone exchange request declined.");
    } catch (error) {
      props.onFeedback(error instanceof ApiError ? error.message : "Unable to update phone exchange request.");
    } finally {
      props.onActionEnd();
    }
  };

  const onReveal = async () => {
    props.onActionStart();
    try {
      const response = await getPhoneUnlock(props.matchId);
      setRevealedPhones(response.users);
      await props.onRefresh();
      props.onFeedback("Phone numbers are now available to both consenting members.");
    } catch (error) {
      props.onFeedback(error instanceof ApiError ? error.message : "Unable to reveal phone numbers.");
    } finally {
      props.onActionEnd();
    }
  };

  if (!props.phoneCase || props.phoneCase.canRequest) {
    return (
      <div className="mt-4 rounded-2xl border border-border/40 bg-background/40 p-3 text-xs text-foreground/75">
        <p className="inline-flex items-center gap-1 uppercase tracking-[0.16em] text-[10px] text-foreground/60"><Phone size={12} /> Private phone exchange</p>
        <p className="mt-2 text-[11px] text-foreground/60">Exchange is enabled only after explicit consent from both members.</p>
        <button onClick={() => void props.onRequest()} disabled={props.pending} className="mt-3 w-full rounded-full border border-border/40 px-3 py-2 text-[10px] uppercase tracking-[0.15em] disabled:opacity-50">{props.pending ? "Requesting…" : "Request phone exchange"}</button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-border/40 bg-background/40 p-3 text-xs text-foreground/75">
      <p className="inline-flex items-center gap-1 uppercase tracking-[0.16em] text-[10px] text-foreground/60"><Phone size={12} /> Phone exchange • {props.phoneCase.status.replaceAll("_", " ")}</p>
      {!mineIsRequester && props.phoneCase.canRespond ? (
        <div className="mt-3 flex gap-2">
          <button onClick={() => void onRespond("YES")} disabled={props.pending} className="rounded-full border border-primary/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Accept</button>
          <button onClick={() => void onRespond("NO")} disabled={props.pending} className="rounded-full border border-border/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] disabled:opacity-50">Decline</button>
        </div>
      ) : null}

      {props.phoneCase.canReveal ? <button onClick={() => void onReveal()} disabled={props.pending} className="mt-3 rounded-full border border-primary/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">View exchanged numbers</button> : null}

      {revealedPhones ? (
        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-foreground/60">Shared private numbers</p>
          <div className="mt-2 space-y-1">
            {revealedPhones.map((entry) => (
              <p key={entry.id} className="font-medium text-sm text-foreground">{entry.phone}</p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
