import { useState } from "react";
import { Link2 } from "lucide-react";
import { ApiError } from "@/lib/api";
import { respondSocialExchange, revealSocialExchange, submitSocialExchangeHandle } from "@/lib/matches";
import type { SocialCaseSnapshot } from "@/features/matches/types";

type SocialExchangePanelProps = {
  matchId: string;
  currentUserId: string;
  socialCase: SocialCaseSnapshot | null;
  pending: boolean;
  onRequest: (matchId: string) => Promise<void>;
  onActionStart: () => void;
  onActionEnd: () => void;
  onRefresh: () => Promise<void>;
  onFeedback: (value: string) => void;
};

export function SocialExchangePanel(props: SocialExchangePanelProps) {
  const [platform, setPlatform] = useState<"Snapchat" | "Instagram" | "LinkedIn">("Instagram");
  const [handle, setHandle] = useState("");
  const [revealed, setRevealed] = useState<{ platform: string; handle: string; revealExpiresAt: string | null } | null>(null);

  if (!props.socialCase) {
    return <div className="mt-4 rounded-2xl border border-border/30 bg-background/40 p-3"><button onClick={() => void props.onRequest(props.matchId)} disabled={props.pending} className="w-full rounded-full border border-border/40 px-3 py-2 text-[10px] uppercase tracking-[0.15em] disabled:opacity-50">{props.pending ? "Requesting…" : "Request social exchange"}</button></div>;
  }

  const socialCase = props.socialCase;
  const mineIsRequester = socialCase.requesterUserId === props.currentUserId;

  const onRespond = async (response: "ACCEPT" | "REJECT") => {
    props.onActionStart();
    try {
      await respondSocialExchange(socialCase.id, response);
      await props.onRefresh();
      props.onFeedback(response === "ACCEPT" ? "Request accepted. Waiting for handle submission." : "Social exchange request declined.");
    } catch (error) {
      props.onFeedback(error instanceof ApiError ? error.message : "Unable to respond to social exchange.");
    } finally {
      props.onActionEnd();
    }
  };

  const onSubmitHandle = async () => {
    props.onActionStart();
    try {
      await submitSocialExchangeHandle(socialCase.id, platform, handle);
      await props.onRefresh();
      props.onFeedback("Handle submitted. Recipient can reveal it for 10 minutes.");
      setHandle("");
    } catch (error) {
      props.onFeedback(error instanceof ApiError ? error.message : "Unable to submit handle.");
    } finally {
      props.onActionEnd();
    }
  };

  const onReveal = async () => {
    props.onActionStart();
    try {
      const response = await revealSocialExchange(socialCase.id);
      if (!response.handle || !response.platform) {
        props.onFeedback("This reveal is unavailable.");
      } else {
        setRevealed({ platform: response.platform, handle: response.handle, revealExpiresAt: response.revealExpiresAt });
      }
      await props.onRefresh();
    } catch (error) {
      props.onFeedback(error instanceof ApiError ? error.message : "Unable to open reveal.");
    } finally {
      props.onActionEnd();
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-border/40 bg-background/40 p-3 text-xs text-foreground/75">
      <p className="inline-flex items-center gap-1 uppercase tracking-[0.16em] text-[10px] text-foreground/60"><Link2 size={12} /> Social exchange • {socialCase.status.replaceAll("_", " ")}</p>
      {socialCase.cooldownUntil ? <p className="mt-2 text-[11px]">Cooldown until {new Date(socialCase.cooldownUntil).toLocaleString()}</p> : null}
      {socialCase.unopenedExpiresAt ? <p className="mt-1 text-[11px]">Unopened expiry {new Date(socialCase.unopenedExpiresAt).toLocaleString()}</p> : null}

      {!mineIsRequester && socialCase.canRespond ? (
        <div className="mt-3 flex gap-2">
          <button onClick={() => void onRespond("ACCEPT")} disabled={props.pending} className="rounded-full border border-primary/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Accept</button>
          <button onClick={() => void onRespond("REJECT")} disabled={props.pending} className="rounded-full border border-border/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] disabled:opacity-50">Decline</button>
        </div>
      ) : null}

      {mineIsRequester && socialCase.canSubmitHandle ? (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            {(["Snapchat", "Instagram", "LinkedIn"] as const).map((option) => (
              <button key={option} onClick={() => setPlatform(option)} className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${platform === option ? "border-primary/60 bg-primary/10" : "border-border/40"}`}>{option}</button>
            ))}
          </div>
          <input value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="Handle (temporary reveal only)" className="w-full rounded-lg border border-border/40 bg-background px-3 py-2 text-sm" />
          <button onClick={() => void onSubmitHandle()} disabled={props.pending || handle.trim().length < 2} className="rounded-full border border-primary/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Submit handle</button>
        </div>
      ) : null}

      {!mineIsRequester && socialCase.canReveal ? <button onClick={() => void onReveal()} disabled={props.pending} className="mt-3 rounded-full border border-primary/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Reveal temporary handle</button> : null}

      {revealed ? <div className="mt-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-3"><p className="text-[10px] uppercase tracking-[0.16em]">{revealed.platform}</p><p className="mt-1 font-medium text-sm">{revealed.handle}</p>{revealed.revealExpiresAt ? <p className="mt-1 text-[11px] text-foreground/60">Visible until {new Date(revealed.revealExpiresAt).toLocaleTimeString()}</p> : null}</div> : null}
    </div>
  );
}
