"use client";

import { useMemo, useState, type ComponentType } from "react";
import { Loader2, MapPin, Phone, UserMinus, Video, Link2, ShieldCheck, RefreshCcw, Clock3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { primeCache, useStaleWhileRevalidate } from "@/lib/cache";
import { fetchMatches, type MatchInteraction, type MatchRequestType } from "@/lib/queries";
import { getOnlineMeet, getPhoneUnlock, getSocialExchange, initiateMatchInteractionRequest, unmatch } from "@/lib/matches";
import { fetchOfflineMeetCase, submitOfflineMeetSelections } from "@/lib/offlineMeet";
import { ApiError } from "@/lib/api";

type PendingAction = `${string}:${MatchRequestType}` | `unmatch:${string}` | `offline:${string}`;

const interactionMeta: Array<{ type: MatchRequestType; label: string; icon: ComponentType<{ className?: string; size?: number }>; }> = [
  { type: "OFFLINE_MEET", label: "Offline meet", icon: MapPin },
  { type: "ONLINE_MEET", label: "Online meet", icon: Video },
  { type: "SOCIAL_EXCHANGE", label: "Social exchange", icon: Link2 },
  { type: "PHONE_EXCHANGE", label: "Phone exchange", icon: Phone }
];

function statusLabel(interaction: MatchInteraction): string {
  if (interaction.status === "ACCEPTED") return "Accepted";
  if (interaction.status === "REJECTED") return "Declined";
  if (interaction.status === "CANCELED") return "Canceled";
  return interaction.isInitiatedByMe ? "Pending response" : "Available";
}

function toRequestPayload(type: MatchRequestType): Record<string, unknown> | undefined {
  if (type === "OFFLINE_MEET") return { note: "Concierge-managed offline meet request" };
  if (type === "ONLINE_MEET") return { note: "Concierge-managed online meet request" };
  if (type === "SOCIAL_EXCHANGE") return { note: "Privacy-first social exchange request" };
  return undefined;
}

export default function MatchesPage() {
  const { isAuthenticated, onboardingStep } = useAuth();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const matchesQuery = useStaleWhileRevalidate({
    key: "matches",
    fetcher: fetchMatches,
    enabled: isAuthenticated && onboardingStep === "COMPLETED",
    staleTimeMs: 45_000
  });

  const matches = useMemo(() => matchesQuery.data ?? [], [matchesQuery.data]);

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  const runInteraction = async (matchId: string, type: MatchRequestType) => {
    const actionKey: PendingAction = `${matchId}:${type}`;
    if (pendingAction === actionKey) return;

    setPendingAction(actionKey);
    setFeedback(null);
    try {
      const response = await initiateMatchInteractionRequest({
        matchId,
        type,
        payload: toRequestPayload(type)
      });

      if (response.ready) {
        if (type === "PHONE_EXCHANGE") {
          await getPhoneUnlock(matchId).catch(() => null);
        }
        if (type === "ONLINE_MEET") {
          await getOnlineMeet(matchId).catch(() => null);
        }
        if (type === "SOCIAL_EXCHANGE") {
          await getSocialExchange(matchId).catch(() => null);
        }
      }

      await matchesQuery.refresh(true);
      setFeedback(response.ready
        ? "Request accepted by both members. Your match handler will continue in Alerts."
        : "Request submitted privately. We will notify you once the other member responds.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to send the request right now.";
      setFeedback(message);
    } finally {
      setPendingAction(null);
    }
  };

  const submitDefaultSelections = async (matchId: string) => {
    const actionKey: PendingAction = `offline:${matchId}`;
    if (pendingAction === actionKey) return;

    setPendingAction(actionKey);
    setFeedback(null);
    try {
      const caseData = await fetchOfflineMeetCase(matchId);
      if (caseData.options.cafes.length < 3 || caseData.options.timeSlots.length < 3) {
        setFeedback("Your concierge has not yet shared offline meet options.");
        return;
      }
      const selectedCafes = caseData.options.cafes.slice(0, 2).map((entry) => entry.id);
      const selectedTimes = caseData.options.timeSlots.slice(0, 3).map((entry) => entry.id);
      await submitOfflineMeetSelections(matchId, selectedCafes, selectedTimes);
      await matchesQuery.refresh(true);
      setFeedback("Your offline meet preferences were submitted privately.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to submit offline meet preferences.";
      setFeedback(message);
    } finally {
      setPendingAction(null);
    }
  };

  const runUnmatch = async (matchId: string) => {
    const actionKey: PendingAction = `unmatch:${matchId}`;
    if (pendingAction === actionKey) return;

    setPendingAction(actionKey);
    setFeedback(null);
    try {
      await unmatch(matchId);
      const next = matches.filter((entry) => entry.id !== matchId);
      primeCache("matches", next);
      matchesQuery.setData(next);
      setFeedback("Match closed. No additional interaction requests can be sent for this connection.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to unmatch at this moment.";
      setFeedback(message);
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="w-full px-6 md:px-8 pt-8 pb-24">
      <div className="pb-8 text-center">
        <h1 className="text-xl tracking-[0.38em] font-medium text-primary uppercase">Matches</h1>
        <p className="mt-2 text-xs text-foreground/55">Private mutual connections managed with concierge-led interaction options.</p>
      </div>

      {feedback ? (
        <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-foreground/75">{feedback}</div>
      ) : null}

      {matchesQuery.isRefreshing && matches.length === 0 ? (
        <div className="space-y-4">{[1, 2].map((key) => <div key={key} className="rounded-3xl border border-border/50 bg-foreground/[0.03] p-4 animate-pulse"><div className="h-52 w-full rounded-2xl bg-foreground/10" /><div className="mt-4 h-4 w-40 rounded bg-foreground/10" /><div className="mt-3 h-3 w-full rounded bg-foreground/10" /></div>)}</div>
      ) : null}

      {!matchesQuery.isRefreshing && matchesQuery.data === undefined ? (
        <div className="rounded-3xl border border-border/40 bg-foreground/[0.02] p-6 text-center"><p className="text-sm text-foreground/70">We could not load your matches right now.</p><button onClick={() => void matchesQuery.refresh(true)} className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-primary"><RefreshCcw size={14} /> Retry</button></div>
      ) : null}

      {!matchesQuery.isRefreshing && matches.length === 0 && matchesQuery.data !== undefined ? (
        <div className="rounded-3xl border border-border/40 bg-foreground/[0.02] p-8 text-center"><ShieldCheck className="mx-auto mb-3 text-primary/70" size={28} /><p className="text-sm text-foreground/75">No active matches yet.</p><p className="mt-2 text-xs text-foreground/55">Mutual likes from verified members will appear here discreetly.</p></div>
      ) : null}

      <div className="space-y-5">
        {matches.map((match) => (
          <article key={match.id} className="rounded-3xl border border-border/40 bg-foreground/[0.02] overflow-hidden">
            <img src={match.image} alt={match.name} className="h-56 w-full object-cover" draggable={false} />
            <div className="p-4">
              <h2 className="text-xl font-serif text-foreground">{match.name}{typeof match.age === "number" ? `, ${match.age}` : ""}</h2>
              <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-foreground/45">{match.location}</p>
              {match.bio ? <p className="mt-3 text-sm text-foreground/70 leading-relaxed">{match.bio}</p> : null}

              <div className="mt-4 grid grid-cols-1 gap-2">
                {interactionMeta.map(({ type, label, icon: Icon }) => {
                  const interaction = match.interactions[type];
                  const actionKey: PendingAction = `${match.id}:${type}`;
                  const busy = pendingAction === actionKey;
                  const disabled = busy || !interaction.canInitiate;
                  return (
                    <button key={type} onClick={() => void runInteraction(match.id, type)} disabled={disabled} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/60 px-3 py-3 disabled:opacity-50">
                      <span className="inline-flex items-center gap-2 text-sm text-foreground/85"><Icon size={16} className="text-primary" />{label}</span>
                      <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-foreground/55">{busy ? <Loader2 size={12} className="animate-spin" /> : null}{statusLabel(interaction)}</span>
                    </button>
                  );
                })}
              </div>

              {match.offlineMeetCase ? (
                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-3 text-xs text-foreground/75">
                  <p className="font-medium tracking-[0.14em] uppercase text-primary/90">Offline meet status: {match.offlineMeetCase.status.replaceAll("_", " ")}</p>
                  {match.offlineMeetCase.responseDeadlineAt ? <p className="mt-2 inline-flex items-center gap-1"><Clock3 size={12} /> Response deadline: {new Date(match.offlineMeetCase.responseDeadlineAt).toLocaleString()}</p> : null}
                  {match.offlineMeetCase.cooldownUntil ? <p className="mt-2">Cooldown until: {new Date(match.offlineMeetCase.cooldownUntil).toLocaleString()}</p> : null}
                  {match.offlineMeetCase.finalCafe && match.offlineMeetCase.finalTimeSlot ? (
                    <p className="mt-2">Finalized at {match.offlineMeetCase.finalCafe.name} — {match.offlineMeetCase.finalTimeSlot.label}</p>
                  ) : null}
                  {(match.offlineMeetCase.status === "AWAITING_USER_SELECTIONS" || match.offlineMeetCase.status === "OPTIONS_SENT" || match.offlineMeetCase.status === "USER_ONE_RESPONDED" || match.offlineMeetCase.status === "USER_TWO_RESPONDED") ? (
                    <button
                      onClick={() => void submitDefaultSelections(match.id)}
                      disabled={pendingAction === `offline:${match.id}`}
                      className="mt-3 rounded-full border border-primary/30 px-3 py-1.5 uppercase tracking-[0.17em] text-[10px] text-primary disabled:opacity-50"
                    >
                      {pendingAction === `offline:${match.id}` ? "Submitting…" : "Submit concierge preferences"}
                    </button>
                  ) : null}
                </div>
              ) : null}

              <button onClick={() => void runUnmatch(match.id)} disabled={pendingAction === `unmatch:${match.id}`} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-foreground/70 disabled:opacity-50">
                {pendingAction === `unmatch:${match.id}` ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />}
                Unmatch
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
