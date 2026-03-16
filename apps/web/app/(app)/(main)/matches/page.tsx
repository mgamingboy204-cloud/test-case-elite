"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Loader2, MapPin, Phone, UserMinus, Video, Link2, ShieldCheck, RefreshCcw, Clock3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { primeCache, useStaleWhileRevalidate } from "@/lib/cache";
import { fetchMatches, type MatchInteraction, type MatchRequestType, type MatchCard } from "@/lib/queries";
import {
  getOnlineMeet,
  getPhoneUnlock,
  initiateMatchInteractionRequest,
  requestSocialExchange,
  respondSocialExchange,
  revealSocialExchange,
  respondMatchConsent,
  submitSocialExchangeHandle,
  type SocialExchangeCase,
  unmatch
} from "@/lib/matches";
import { fetchOfflineMeetCase, submitOfflineMeetSelections } from "@/lib/offlineMeet";
import { fetchOnlineMeetCase, submitOnlineMeetSelections, type MeetPlatform } from "@/lib/onlineMeet";
import { ApiError } from "@/lib/api";
import { normalizeApiError } from "@/lib/apiErrors";
import { ProtectedState } from "@/components/ui/protected-state";

type PendingAction = `${string}:${MatchRequestType}` | `unmatch:${string}` | `offline:${string}` | `online:${string}` | `social:${string}`;

type SocialCaseSnapshot = {
  id: string;
  requesterUserId: string;
  receiverUserId: string;
  status: string;
  platform: string | null;
  revealOpenedAt: string | null;
  revealExpiresAt: string | null;
  unopenedExpiresAt: string | null;
  cooldownUntil: string | null;
  canRespond: boolean;
  canSubmitHandle: boolean;
  canReveal: boolean;
};

function normalizeSocialCase(
  input: SocialExchangeCase | MatchCard["socialExchangeCase"] | null,
  currentUserId: string
): SocialCaseSnapshot | null {
  if (!input) return null;

  const status = String(input.status);
  const requesterUserId = input.requesterUserId;
  const receiverUserId = input.receiverUserId;
  const mineIsRequester = requesterUserId === currentUserId;

  const canRespond =
    typeof (input as SocialExchangeCase).canRespond === "boolean"
      ? (input as SocialExchangeCase).canRespond!
      : !mineIsRequester && status === "REQUESTED";

  const canSubmitHandle =
    typeof (input as SocialExchangeCase).canSubmitHandle === "boolean"
      ? (input as SocialExchangeCase).canSubmitHandle!
      : mineIsRequester && (status === "ACCEPTED" || status === "AWAITING_HANDLE_SUBMISSION");

  const canReveal =
    typeof (input as SocialExchangeCase).canReveal === "boolean"
      ? (input as SocialExchangeCase).canReveal!
      : !mineIsRequester && (status === "READY_TO_REVEAL" || status === "REVEALED");

  return {
    id: input.id,
    requesterUserId,
    receiverUserId,
    status,
    platform: input.platform ?? null,
    revealOpenedAt: input.revealOpenedAt ?? null,
    revealExpiresAt: input.revealExpiresAt ?? null,
    unopenedExpiresAt: input.unopenedExpiresAt ?? null,
    cooldownUntil: input.cooldownUntil ?? null,
    canRespond,
    canSubmitHandle,
    canReveal
  };
}

const interactionMeta: Array<{ type: MatchRequestType; label: string; icon: ComponentType<{ className?: string; size?: number }> }> = [
  { type: "OFFLINE_MEET", label: "Offline meet", icon: MapPin },
  { type: "ONLINE_MEET", label: "Online meet", icon: Video }
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
  return undefined;
}

export default function MatchesPage() {
  const { isAuthenticated, onboardingStep, user } = useAuth();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [onlineDraftByMatch, setOnlineDraftByMatch] = useState<Record<string, { platform: MeetPlatform | null; timeSlots: string[] }>>({});

  const matchesQuery = useStaleWhileRevalidate({
    key: "matches",
    fetcher: fetchMatches,
    enabled: isAuthenticated && onboardingStep === "COMPLETED",
    staleTimeMs: 45_000
  });

  const matches = useMemo(() => matchesQuery.data ?? [], [matchesQuery.data]);

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  if (matchesQuery.error && !matchesQuery.data) {
    const normalized = normalizeApiError(matchesQuery.error);
    return <ProtectedState title="Matches unavailable" description={normalized.message} />;
  }

  const runInteraction = async (matchId: string, type: MatchRequestType) => {
    const actionKey: PendingAction = `${matchId}:${type}`;
    if (pendingAction === actionKey) return;

    setPendingAction(actionKey);
    setFeedback(null);
    try {
      const response = await initiateMatchInteractionRequest({ matchId, type, payload: toRequestPayload(type) });
      if (response.ready) {
        if (type === "PHONE_EXCHANGE") await getPhoneUnlock(matchId).catch(() => null);
        if (type === "ONLINE_MEET") await getOnlineMeet(matchId).catch(() => null);
      }
      await matchesQuery.refresh(true);
      setFeedback(response.ready ? "Request accepted by both members. Your match handler will continue in Alerts." : "Request submitted privately. We will notify you once the other member responds.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to send the request right now.";
      setFeedback(message);
    } finally {
      setPendingAction(null);
    }
  };

  const runSocialRequest = async (matchId: string) => {
    const actionKey: PendingAction = `social:${matchId}`;
    if (pendingAction === actionKey) return;
    setPendingAction(actionKey);
    setFeedback(null);
    try {
      await requestSocialExchange(matchId);
      await matchesQuery.refresh(true);
      setFeedback("Private social exchange request sent. Waiting for member consent.");
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : "Unable to create social exchange request.");
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

  const toggleOnlineTimeSlot = (matchId: string, slotId: string) => {
    setOnlineDraftByMatch((current) => {
      const draft = current[matchId] ?? { platform: null, timeSlots: [] };
      const exists = draft.timeSlots.includes(slotId);
      const nextSlots = exists ? draft.timeSlots.filter((entry) => entry !== slotId) : [...draft.timeSlots, slotId].slice(0, 4);
      return { ...current, [matchId]: { ...draft, timeSlots: nextSlots } };
    });
  };

  const setOnlinePlatform = (matchId: string, platform: MeetPlatform) => {
    setOnlineDraftByMatch((current) => ({ ...current, [matchId]: { ...(current[matchId] ?? { platform: null, timeSlots: [] }), platform } }));
  };

  const submitOnlineSelections = async (matchId: string) => {
    const actionKey: PendingAction = `online:${matchId}`;
    if (pendingAction === actionKey) return;

    setPendingAction(actionKey);
    setFeedback(null);
    try {
      await fetchOnlineMeetCase(matchId);
      const draft = onlineDraftByMatch[matchId] ?? { platform: null, timeSlots: [] };
      if (!draft.platform || draft.timeSlots.length < 2 || draft.timeSlots.length > 4) {
        setFeedback("Please choose one platform and 2 to 4 preferred time slots.");
        return;
      }
      await submitOnlineMeetSelections(matchId, { platform: draft.platform, timeSlots: draft.timeSlots });
      await matchesQuery.refresh(true);
      setFeedback("Your online meet preferences were submitted privately.");
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "Unable to submit online meet preferences.";
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

      {feedback ? <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-foreground/75">{feedback}</div> : null}

      {matchesQuery.isRefreshing && matches.length === 0 ? <div className="space-y-4">{[1, 2].map((key) => <div key={key} className="rounded-3xl border border-border/50 bg-foreground/[0.03] p-4 animate-pulse"><div className="h-52 w-full rounded-2xl bg-foreground/10" /><div className="mt-4 h-4 w-40 rounded bg-foreground/10" /><div className="mt-3 h-3 w-full rounded bg-foreground/10" /></div>)}</div> : null}

      {!matchesQuery.isRefreshing && matchesQuery.data === undefined ? <div className="rounded-3xl border border-border/40 bg-foreground/[0.02] p-6 text-center"><p className="text-sm text-foreground/70">We could not load your matches right now.</p><button onClick={() => void matchesQuery.refresh(true)} className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-primary"><RefreshCcw size={14} /> Retry</button></div> : null}

      {!matchesQuery.isRefreshing && matches.length === 0 && matchesQuery.data !== undefined ? <div className="rounded-3xl border border-border/40 bg-foreground/[0.02] p-8 text-center"><ShieldCheck className="mx-auto mb-3 text-primary/70" size={28} /><p className="text-sm text-foreground/75">No active matches yet.</p><p className="mt-2 text-xs text-foreground/55">Mutual likes from verified members will appear here discreetly.</p></div> : null}

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
                  return <button key={type} onClick={() => void runInteraction(match.id, type)} disabled={disabled} className="flex items-center justify-between rounded-xl border border-border/40 bg-background/60 px-3 py-3 disabled:opacity-50"><span className="inline-flex items-center gap-2 text-sm text-foreground/85"><Icon size={16} className="text-primary" />{label}</span><span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-foreground/55">{busy ? <Loader2 size={12} className="animate-spin" /> : null}{statusLabel(interaction)}</span></button>;
                })}
              </div>

              <PhoneExchangePanel
                matchId={match.id}
                currentUserId={user?.id ?? ""}
                phoneCase={match.phoneExchangeCase}
                pending={pendingAction === `${match.id}:PHONE_EXCHANGE`}
                onRequest={() => runInteraction(match.id, "PHONE_EXCHANGE")}
                onFeedback={setFeedback}
                onRefresh={() => matchesQuery.refresh(true)}
                onActionStart={() => setPendingAction(`${match.id}:PHONE_EXCHANGE`)}
                onActionEnd={() => setPendingAction(null)}
              />

              <SocialExchangePanel
                matchId={match.id}
                currentUserId={user?.id ?? ""}
                socialCase={normalizeSocialCase(match.socialExchangeCase ?? null, user?.id ?? "")}
                pending={pendingAction === `social:${match.id}`}
                onRequest={runSocialRequest}
                onActionStart={() => setPendingAction(`social:${match.id}`)}
                onActionEnd={() => setPendingAction(null)}
                onRefresh={() => matchesQuery.refresh(true)}
                onFeedback={setFeedback}
              />
              
              {match.offlineMeetCase ? <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-3 text-xs text-foreground/75"><p className="font-medium tracking-[0.14em] uppercase text-primary/90">Offline meet status: {match.offlineMeetCase.status.replaceAll("_", " ")}</p>{match.offlineMeetCase.responseDeadlineAt ? <p className="mt-2 inline-flex items-center gap-1"><Clock3 size={12} /> Response deadline: {new Date(match.offlineMeetCase.responseDeadlineAt).toLocaleString()}</p> : null}{match.offlineMeetCase.cooldownUntil ? <p className="mt-2">Cooldown until: {new Date(match.offlineMeetCase.cooldownUntil).toLocaleString()}</p> : null}{match.offlineMeetCase.finalCafe && match.offlineMeetCase.finalTimeSlot ? <p className="mt-2">Finalized at {match.offlineMeetCase.finalCafe.name} — {match.offlineMeetCase.finalTimeSlot.label}</p> : null}{(match.offlineMeetCase.status === "AWAITING_USER_SELECTIONS" || match.offlineMeetCase.status === "OPTIONS_SENT" || match.offlineMeetCase.status === "USER_ONE_RESPONDED" || match.offlineMeetCase.status === "USER_TWO_RESPONDED") ? <button onClick={() => void submitDefaultSelections(match.id)} disabled={pendingAction === `offline:${match.id}`} className="mt-3 rounded-full border border-primary/30 px-3 py-1.5 uppercase tracking-[0.17em] text-[10px] text-primary disabled:opacity-50">{pendingAction === `offline:${match.id}` ? "Submitting…" : "Submit concierge preferences"}</button> : null}</div> : null}

              {match.onlineMeetCase ? <div className="mt-4 rounded-2xl border border-highlight/20 bg-highlight/[0.05] p-3 text-xs text-foreground/75"><p className="font-medium tracking-[0.14em] uppercase text-highlight">Online meet status: {match.onlineMeetCase.status.replaceAll("_", " ")}</p>{match.onlineMeetCase.responseDeadlineAt ? <p className="mt-2 inline-flex items-center gap-1"><Clock3 size={12} /> Response deadline: {new Date(match.onlineMeetCase.responseDeadlineAt).toLocaleString()}</p> : null}{match.onlineMeetCase.cooldownUntil ? <p className="mt-2">Cooldown until: {new Date(match.onlineMeetCase.cooldownUntil).toLocaleString()}</p> : null}{match.onlineMeetCase.finalPlatform && match.onlineMeetCase.finalTimeSlot ? <p className="mt-2">Finalized: {match.onlineMeetCase.finalPlatform.replaceAll("_", " ")} — {match.onlineMeetCase.finalTimeSlot.label}</p> : null}{(match.onlineMeetCase.status === "AWAITING_USER_SELECTIONS" || match.onlineMeetCase.status === "OPTIONS_SENT" || match.onlineMeetCase.status === "USER_ONE_RESPONDED" || match.onlineMeetCase.status === "USER_TWO_RESPONDED") ? <OnlineMeetSelectionPanel matchId={match.id} pending={pendingAction === `online:${match.id}`} draft={onlineDraftByMatch[match.id] ?? { platform: null, timeSlots: [] }} onToggleSlot={toggleOnlineTimeSlot} onPlatformSelect={setOnlinePlatform} onSubmit={submitOnlineSelections} /> : null}</div> : null}

              <button onClick={() => void runUnmatch(match.id)} disabled={pendingAction === `unmatch:${match.id}`} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-foreground/70 disabled:opacity-50">{pendingAction === `unmatch:${match.id}` ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />} Unmatch</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function PhoneExchangePanel(props: {
  matchId: string;
  currentUserId: string;
  phoneCase: {
    id: string;
    requesterUserId: string;
    receiverUserId: string;
    status: string;
    canRequest: boolean;
    canRespond: boolean;
    canReveal: boolean;
  } | null;
  pending: boolean;
  onRequest: () => Promise<void>;
  onFeedback: (value: string) => void;
  onRefresh: () => Promise<void>;
  onActionStart: () => void;
  onActionEnd: () => void;
}) {
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

function SocialExchangePanel(props: {
  matchId: string;
  currentUserId: string;
  socialCase: SocialCaseSnapshot | null;
  pending: boolean;
  onRequest: (matchId: string) => Promise<void>;
  onActionStart: () => void;
  onActionEnd: () => void;
  onRefresh: () => Promise<void>;
  onFeedback: (value: string) => void;
}) {
  const [platform, setPlatform] = useState<"Snapchat" | "Instagram" | "LinkedIn">("Instagram");
  const [handle, setHandle] = useState("");
  const [revealed, setRevealed] = useState<{ platform: string; handle: string; revealExpiresAt: string | null } | null>(null);

  if (!props.socialCase) {
    return <div className="mt-4 rounded-2xl border border-border/30 bg-background/40 p-3"><button onClick={() => void props.onRequest(props.matchId)} disabled={props.pending} className="w-full rounded-full border border-border/40 px-3 py-2 text-[10px] uppercase tracking-[0.15em] disabled:opacity-50">{props.pending ? "Requesting…" : "Request social exchange"}</button></div>;
  }

  const mineIsRequester = props.socialCase.requesterUserId === props.currentUserId;

  const onRespond = async (response: "ACCEPT" | "REJECT") => {
    props.onActionStart();
    try {
      await respondSocialExchange(props.socialCase!.id, response);
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
      await submitSocialExchangeHandle(props.socialCase!.id, platform, handle);
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
      const response = await revealSocialExchange(props.socialCase!.id);
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
      <p className="inline-flex items-center gap-1 uppercase tracking-[0.16em] text-[10px] text-foreground/60"><Link2 size={12} /> Social exchange • {props.socialCase.status.replaceAll("_", " ")}</p>
      {props.socialCase.cooldownUntil ? <p className="mt-2 text-[11px]">Cooldown until {new Date(props.socialCase.cooldownUntil).toLocaleString()}</p> : null}
      {props.socialCase.unopenedExpiresAt ? <p className="mt-1 text-[11px]">Unopened expiry {new Date(props.socialCase.unopenedExpiresAt).toLocaleString()}</p> : null}

      {!mineIsRequester && props.socialCase.canRespond ? (
        <div className="mt-3 flex gap-2">
          <button onClick={() => void onRespond("ACCEPT")} disabled={props.pending} className="rounded-full border border-primary/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Accept</button>
          <button onClick={() => void onRespond("REJECT")} disabled={props.pending} className="rounded-full border border-border/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] disabled:opacity-50">Decline</button>
        </div>
      ) : null}

      {mineIsRequester && props.socialCase.canSubmitHandle ? (
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

      {!mineIsRequester && props.socialCase.canReveal ? <button onClick={() => void onReveal()} disabled={props.pending} className="mt-3 rounded-full border border-primary/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Reveal temporary handle</button> : null}

      {revealed ? <div className="mt-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-3"><p className="text-[10px] uppercase tracking-[0.16em]">{revealed.platform}</p><p className="mt-1 font-medium text-sm">{revealed.handle}</p>{revealed.revealExpiresAt ? <p className="mt-1 text-[11px] text-foreground/60">Visible until {new Date(revealed.revealExpiresAt).toLocaleTimeString()}</p> : null}</div> : null}
    </div>
  );
}

function OnlineMeetSelectionPanel(props: {
  matchId: string;
  pending: boolean;
  draft: { platform: MeetPlatform | null; timeSlots: string[] };
  onPlatformSelect: (matchId: string, platform: MeetPlatform) => void;
  onToggleSlot: (matchId: string, slotId: string) => void;
  onSubmit: (matchId: string) => Promise<void>;
}) {
  const [options, setOptions] = useState<{ platforms: MeetPlatform[]; timeSlots: Array<{ id: string; label: string }> }>({ platforms: [], timeSlots: [] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchOnlineMeetCase(props.matchId)
      .then((value) => {
        if (!active) return;
        setOptions({ platforms: value.options.platforms, timeSlots: value.options.timeSlots.map((entry) => ({ id: entry.id, label: entry.label })) });
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to load online meet options right now.");
      });
    return () => {
      active = false;
    };
  }, [props.matchId]);

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
