"use client";

import { useMemo, useState } from "react";
import { Clock3, Link2, Loader2, MapPin, Phone, RefreshCcw, ShieldCheck, UserMinus, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { normalizeApiError } from "@/lib/apiErrors";
import { type SocialExchangeCase } from "@/lib/matches";
import { type MeetPlatform } from "@/lib/onlineMeet";
import { type MatchInteraction, type MatchRequestType, type MatchCard } from "@/lib/queries";
import { ProtectedState } from "@/components/ui/protected-state";
import {
  useGetPhoneUnlockMutation,
  useInitiateMatchInteractionMutation,
  useMatchesData,
  useOfflineMeetCaseData,
  useOnlineMeetCaseData,
  useRequestSocialExchangeMutation,
  useRespondMatchConsentMutation,
  useRespondSocialExchangeMutation,
  useRevealSocialExchangeMutation,
  useSubmitOfflineMeetSelectionsMutation,
  useSubmitOnlineMeetSelectionsMutation,
  useSubmitSocialExchangeHandleMutation,
  useUnmatchMutation
} from "@/lib/memberState";

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

const interactionMeta = [
  { type: "OFFLINE_MEET" as const, label: "Offline meet", icon: MapPin },
  { type: "ONLINE_MEET" as const, label: "Online meet", icon: Video }
];

const awaitingSelectionStatuses = new Set([
  "AWAITING_USER_SELECTIONS",
  "OPTIONS_SENT",
  "USER_ONE_RESPONDED",
  "USER_TWO_RESPONDED"
]);

function normalizeSocialCase(
  input: SocialExchangeCase | MatchCard["socialExchangeCase"] | null,
  currentUserId: string
): SocialCaseSnapshot | null {
  if (!input) return null;

  const status = String(input.status);
  const requesterUserId = input.requesterUserId;
  const receiverUserId = input.receiverUserId;
  const mineIsRequester = requesterUserId === currentUserId;

  const canRespond = Boolean(
    typeof (input as SocialExchangeCase).canRespond === "boolean"
      ? (input as SocialExchangeCase).canRespond
      : !mineIsRequester && status === "REQUESTED"
  );

  const canSubmitHandle = Boolean(
    typeof (input as SocialExchangeCase).canSubmitHandle === "boolean"
      ? (input as SocialExchangeCase).canSubmitHandle
      : mineIsRequester && (status === "ACCEPTED" || status === "AWAITING_HANDLE_SUBMISSION")
  );

  const canReveal = Boolean(
    typeof (input as SocialExchangeCase).canReveal === "boolean"
      ? (input as SocialExchangeCase).canReveal
      : !mineIsRequester && (status === "READY_TO_REVEAL" || status === "REVEALED")
  );

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

function statusLabel(interaction: MatchInteraction) {
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

function toConsentType(type: MatchRequestType): "PHONE_NUMBER" | "OFFLINE_MEET" | "ONLINE_MEET" | "SOCIAL_EXCHANGE" {
  return type === "PHONE_EXCHANGE" ? "PHONE_NUMBER" : type;
}

function toAwaitingResponse(interaction: MatchInteraction) {
  return interaction.status === "PENDING" && !interaction.isInitiatedByMe;
}

export default function MatchesPage() {
  const { isAuthenticated, onboardingStep, user } = useAuth();
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [offlineDraftByMatch, setOfflineDraftByMatch] = useState<Record<string, { cafes: string[]; timeSlots: string[] }>>({});
  const [onlineDraftByMatch, setOnlineDraftByMatch] = useState<Record<string, { platform: MeetPlatform | null; timeSlots: string[] }>>({});
  const matchesQuery = useMatchesData(isAuthenticated && onboardingStep === "COMPLETED");
  const initiateInteractionMutation = useInitiateMatchInteractionMutation();
  const respondMatchConsentMutation = useRespondMatchConsentMutation();
  const requestSocialExchangeMutation = useRequestSocialExchangeMutation();
  const submitOfflineMeetSelectionsMutation = useSubmitOfflineMeetSelectionsMutation();
  const submitOnlineMeetSelectionsMutation = useSubmitOnlineMeetSelectionsMutation();
  const unmatchMutation = useUnmatchMutation();
  const matches = matchesQuery.data ?? [];

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  if (matchesQuery.error && matches.length === 0) {
    const normalized = normalizeApiError(matchesQuery.error);
    return <ProtectedState title="Matches unavailable" description={normalized.message} />;
  }

  const runInteraction = async (matchId: string, type: MatchRequestType) => {
    const actionKey: PendingAction = `${matchId}:${type}`;
    if (pendingAction === actionKey) return;
    setPendingAction(actionKey);
    setFeedback(null);
    try {
      const response = await initiateInteractionMutation.mutateAsync({ matchId, type, payload: toRequestPayload(type) });
      setFeedback(response.ready ? "Request accepted by both members. Your match handler will continue in Alerts." : "Request submitted privately. We will notify you once the other member responds.");
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : "Unable to send the request right now.");
    } finally {
      setPendingAction(null);
    }
  };

  const runDeclineInteraction = async (matchId: string, type: MatchRequestType) => {
    const actionKey: PendingAction = `${matchId}:${type}`;
    if (pendingAction === actionKey) return;
    setPendingAction(actionKey);
    setFeedback(null);
    try {
      const response = await respondMatchConsentMutation.mutateAsync({ matchId, type: toConsentType(type), response: "NO" });
      setFeedback(response.ready ? "Interaction updated." : "Request declined. Your preference has been saved.");
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : "Unable to update this request right now.");
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
      await requestSocialExchangeMutation.mutateAsync(matchId);
      setFeedback("Private social exchange request sent. Waiting for member consent.");
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : "Unable to create social exchange request.");
    } finally {
      setPendingAction(null);
    }
  };

  const toggleOfflineCafe = (matchId: string, cafeId: string) => {
    setOfflineDraftByMatch((current) => {
      const draft = current[matchId] ?? { cafes: [], timeSlots: [] };
      const exists = draft.cafes.includes(cafeId);
      const nextCafes = exists ? draft.cafes.filter((entry) => entry !== cafeId) : [...draft.cafes, cafeId].slice(0, 2);
      return { ...current, [matchId]: { ...draft, cafes: nextCafes } };
    });
  };

  const toggleOfflineTimeSlot = (matchId: string, slotId: string) => {
    setOfflineDraftByMatch((current) => {
      const draft = current[matchId] ?? { cafes: [], timeSlots: [] };
      const exists = draft.timeSlots.includes(slotId);
      const nextSlots = exists ? draft.timeSlots.filter((entry) => entry !== slotId) : [...draft.timeSlots, slotId].slice(0, 4);
      return { ...current, [matchId]: { ...draft, timeSlots: nextSlots } };
    });
  };

  const submitOfflineSelections = async (matchId: string) => {
    const actionKey: PendingAction = `offline:${matchId}`;
    if (pendingAction === actionKey) return;
    setPendingAction(actionKey);
    setFeedback(null);
    try {
      const draft = offlineDraftByMatch[matchId] ?? { cafes: [], timeSlots: [] };
      if (draft.cafes.length !== 2 || draft.timeSlots.length < 3 || draft.timeSlots.length > 4) {
        setFeedback("Please choose exactly 2 cafes and 3 to 4 preferred time slots.");
        return;
      }
      await submitOfflineMeetSelectionsMutation.mutateAsync({ matchId, cafes: draft.cafes, timeSlots: draft.timeSlots });
      setFeedback("Your offline meet preferences were submitted privately.");
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : "Unable to submit offline meet preferences.");
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
      const draft = onlineDraftByMatch[matchId] ?? { platform: null, timeSlots: [] };
      if (!draft.platform || draft.timeSlots.length < 2 || draft.timeSlots.length > 4) {
        setFeedback("Please choose one platform and 2 to 4 preferred time slots.");
        return;
      }
      await submitOnlineMeetSelectionsMutation.mutateAsync({ matchId, platform: draft.platform, timeSlots: draft.timeSlots });
      setFeedback("Your online meet preferences were submitted privately.");
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : "Unable to submit online meet preferences.");
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
      await unmatchMutation.mutateAsync(matchId);
      setFeedback("Match closed. No additional interaction requests can be sent for this connection.");
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : "Unable to unmatch at this moment.");
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
      {matchesQuery.isFetching && matches.length === 0 ? (
        <div className="space-y-4">
          {[1, 2].map((key) => (
            <div key={key} className="rounded-3xl border border-border/50 bg-foreground/[0.03] p-4 animate-pulse">
              <div className="h-52 w-full rounded-2xl bg-foreground/10" />
              <div className="mt-4 h-4 w-40 rounded bg-foreground/10" />
              <div className="mt-3 h-3 w-full rounded bg-foreground/10" />
            </div>
          ))}
        </div>
      ) : null}

      {!matchesQuery.isFetching && matches.length === 0 ? (
        <div className="rounded-3xl border border-border/40 bg-foreground/[0.02] p-8 text-center">
          <ShieldCheck className="mx-auto mb-3 text-primary/70" size={28} />
          <p className="text-sm text-foreground/75">No active matches yet.</p>
          <p className="mt-2 text-xs text-foreground/55">Mutual likes from verified members will appear here discreetly.</p>
          {matchesQuery.error ? (
            <button onClick={() => void matchesQuery.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-primary">
              <RefreshCcw size={14} /> Retry
            </button>
          ) : null}
        </div>
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
                  const awaitingResponse = toAwaitingResponse(interaction);
                  const disabled = busy || (!interaction.canInitiate && !awaitingResponse);

                  return (
                    <div key={type} className="rounded-xl border border-border/40 bg-background/60 px-3 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-sm text-foreground/85"><Icon size={16} className="text-primary" />{label}</span>
                        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-foreground/55">
                          {busy ? <Loader2 size={12} className="animate-spin" /> : null}
                          {statusLabel(interaction)}
                        </span>
                      </div>
                      {awaitingResponse ? (
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => void runInteraction(match.id, type)} disabled={busy} className="rounded-full border border-primary/35 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Accept</button>
                          <button onClick={() => void runDeclineInteraction(match.id, type)} disabled={busy} className="rounded-full border border-border/50 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-foreground/70 disabled:opacity-50">Decline</button>
                        </div>
                      ) : (
                        <button onClick={() => void runInteraction(match.id, type)} disabled={disabled} className="mt-2 rounded-full border border-primary/35 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Request</button>
                      )}
                    </div>
                  );
                })}
              </div>

              <PhoneExchangePanel matchId={match.id} currentUserId={user?.id ?? ""} phoneCase={match.phoneExchangeCase} pending={pendingAction === `${match.id}:PHONE_EXCHANGE`} onRequest={() => runInteraction(match.id, "PHONE_EXCHANGE")} onFeedback={setFeedback} />
              <SocialExchangePanel matchId={match.id} currentUserId={user?.id ?? ""} socialCase={normalizeSocialCase(match.socialExchangeCase ?? null, user?.id ?? "")} pending={pendingAction === `social:${match.id}`} onRequest={runSocialRequest} onFeedback={setFeedback} />

              {match.offlineMeetCase ? <OfflineMeetSection matchId={match.id} summary={match.offlineMeetCase} pending={pendingAction === `offline:${match.id}`} draft={offlineDraftByMatch[match.id] ?? { cafes: [], timeSlots: [] }} onToggleCafe={toggleOfflineCafe} onToggleSlot={toggleOfflineTimeSlot} onSubmit={submitOfflineSelections} /> : null}
              {match.onlineMeetCase ? <OnlineMeetSection matchId={match.id} summary={match.onlineMeetCase} pending={pendingAction === `online:${match.id}`} draft={onlineDraftByMatch[match.id] ?? { platform: null, timeSlots: [] }} onPlatformSelect={setOnlinePlatform} onToggleSlot={toggleOnlineTimeSlot} onSubmit={submitOnlineSelections} /> : null}

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

function PhoneExchangePanel(props: {
  matchId: string;
  currentUserId: string;
  phoneCase: MatchCard["phoneExchangeCase"];
  pending: boolean;
  onRequest: () => Promise<void>;
  onFeedback: (value: string) => void;
}) {
  const [revealedPhones, setRevealedPhones] = useState<Array<{ id: string; phone: string }> | null>(null);
  const respondMutation = useRespondMatchConsentMutation();
  const phoneUnlockMutation = useGetPhoneUnlockMutation();
  const isBusy = props.pending || respondMutation.isPending || phoneUnlockMutation.isPending;
  const mineIsRequester = props.phoneCase?.requesterUserId === props.currentUserId;

  const onRespond = async (response: "YES" | "NO") => {
    try {
      await respondMutation.mutateAsync({ matchId: props.matchId, type: "PHONE_NUMBER", response });
      props.onFeedback(response === "YES" ? "Phone exchange accepted. Contact access is now available privately." : "Phone exchange request declined.");
    } catch (error) {
      props.onFeedback(error instanceof ApiError ? error.message : "Unable to update phone exchange request.");
    }
  };

  const onReveal = async () => {
    try {
      const response = await phoneUnlockMutation.mutateAsync(props.matchId);
      setRevealedPhones(response.users);
      props.onFeedback("Phone numbers are now available to both consenting members.");
    } catch (error) {
      props.onFeedback(error instanceof ApiError ? error.message : "Unable to reveal phone numbers.");
    }
  };

  if (!props.phoneCase || props.phoneCase.canRequest) {
    return (
      <div className="mt-4 rounded-2xl border border-border/40 bg-background/40 p-3 text-xs text-foreground/75">
        <p className="inline-flex items-center gap-1 uppercase tracking-[0.16em] text-[10px] text-foreground/60"><Phone size={12} /> Private phone exchange</p>
        <p className="mt-2 text-[11px] text-foreground/60">Exchange is enabled only after explicit consent from both members.</p>
        <button onClick={() => void props.onRequest()} disabled={isBusy} className="mt-3 w-full rounded-full border border-border/40 px-3 py-2 text-[10px] uppercase tracking-[0.15em] disabled:opacity-50">{isBusy ? "Requesting..." : "Request phone exchange"}</button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-border/40 bg-background/40 p-3 text-xs text-foreground/75">
      <p className="inline-flex items-center gap-1 uppercase tracking-[0.16em] text-[10px] text-foreground/60"><Phone size={12} /> Phone exchange - {props.phoneCase.status.replaceAll("_", " ")}</p>
      {!mineIsRequester && props.phoneCase.canRespond ? (
        <div className="mt-3 flex gap-2">
          <button onClick={() => void onRespond("YES")} disabled={isBusy} className="rounded-full border border-primary/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Accept</button>
          <button onClick={() => void onRespond("NO")} disabled={isBusy} className="rounded-full border border-border/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] disabled:opacity-50">Decline</button>
        </div>
      ) : null}

      {props.phoneCase.canReveal ? <button onClick={() => void onReveal()} disabled={isBusy} className="mt-3 rounded-full border border-primary/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">View exchanged numbers</button> : null}

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
  onFeedback: (value: string) => void;
}) {
  const [platform, setPlatform] = useState<"Snapchat" | "Instagram" | "LinkedIn">("Instagram");
  const [handle, setHandle] = useState("");
  const [revealed, setRevealed] = useState<{ platform: string; handle: string; revealExpiresAt: string | null } | null>(null);
  const respondMutation = useRespondSocialExchangeMutation();
  const submitHandleMutation = useSubmitSocialExchangeHandleMutation();
  const revealMutation = useRevealSocialExchangeMutation();
  const isBusy = props.pending || respondMutation.isPending || submitHandleMutation.isPending || revealMutation.isPending;

  if (!props.socialCase) {
    return (
      <div className="mt-4 rounded-2xl border border-border/30 bg-background/40 p-3">
        <button onClick={() => void props.onRequest(props.matchId)} disabled={isBusy} className="w-full rounded-full border border-border/40 px-3 py-2 text-[10px] uppercase tracking-[0.15em] disabled:opacity-50">{isBusy ? "Requesting..." : "Request social exchange"}</button>
      </div>
    );
  }

  const socialCase = props.socialCase;
  const mineIsRequester = socialCase.requesterUserId === props.currentUserId;

  const onRespond = async (response: "ACCEPT" | "REJECT") => {
    try {
      await respondMutation.mutateAsync({ caseId: socialCase.id, response });
      props.onFeedback(response === "ACCEPT" ? "Request accepted. Waiting for handle submission." : "Social exchange request declined.");
    } catch (error) {
      props.onFeedback(error instanceof ApiError ? error.message : "Unable to respond to social exchange.");
    }
  };

  const onSubmitHandle = async () => {
    try {
      await submitHandleMutation.mutateAsync({ caseId: socialCase.id, platform, handle });
      setHandle("");
      props.onFeedback("Handle submitted. Recipient can reveal it for 10 minutes.");
    } catch (error) {
      props.onFeedback(error instanceof ApiError ? error.message : "Unable to submit handle.");
    }
  };

  const onReveal = async () => {
    try {
      const response = await revealMutation.mutateAsync(socialCase.id);
      if (!response.handle || !response.platform) {
        props.onFeedback("This reveal is unavailable.");
        return;
      }
      setRevealed({ platform: response.platform, handle: response.handle, revealExpiresAt: response.revealExpiresAt });
    } catch (error) {
      props.onFeedback(error instanceof ApiError ? error.message : "Unable to open reveal.");
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-border/40 bg-background/40 p-3 text-xs text-foreground/75">
      <p className="inline-flex items-center gap-1 uppercase tracking-[0.16em] text-[10px] text-foreground/60"><Link2 size={12} /> Social exchange - {socialCase.status.replaceAll("_", " ")}</p>
      {socialCase.cooldownUntil ? <p className="mt-2 text-[11px]">Cooldown until {new Date(socialCase.cooldownUntil).toLocaleString()}</p> : null}
      {socialCase.unopenedExpiresAt ? <p className="mt-1 text-[11px]">Unopened expiry {new Date(socialCase.unopenedExpiresAt).toLocaleString()}</p> : null}

      {!mineIsRequester && socialCase.canRespond ? (
        <div className="mt-3 flex gap-2">
          <button onClick={() => void onRespond("ACCEPT")} disabled={isBusy} className="rounded-full border border-primary/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Accept</button>
          <button onClick={() => void onRespond("REJECT")} disabled={isBusy} className="rounded-full border border-border/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] disabled:opacity-50">Decline</button>
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
          <button onClick={() => void onSubmitHandle()} disabled={isBusy || handle.trim().length < 2} className="rounded-full border border-primary/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Submit handle</button>
        </div>
      ) : null}

      {!mineIsRequester && socialCase.canReveal ? <button onClick={() => void onReveal()} disabled={isBusy} className="mt-3 rounded-full border border-primary/40 px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Reveal temporary handle</button> : null}

      {revealed ? (
        <div className="mt-3 rounded-xl border border-primary/20 bg-primary/[0.06] p-3">
          <p className="text-[10px] uppercase tracking-[0.16em]">{revealed.platform}</p>
          <p className="mt-1 font-medium text-sm">{revealed.handle}</p>
          {revealed.revealExpiresAt ? <p className="mt-1 text-[11px] text-foreground/60">Visible until {new Date(revealed.revealExpiresAt).toLocaleTimeString()}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function OfflineMeetSection(props: {
  matchId: string;
  summary: NonNullable<MatchCard["offlineMeetCase"]>;
  pending: boolean;
  draft: { cafes: string[]; timeSlots: string[] };
  onToggleCafe: (matchId: string, cafeId: string) => void;
  onToggleSlot: (matchId: string, slotId: string) => void;
  onSubmit: (matchId: string) => Promise<void>;
}) {
  const offlineMeetCaseQuery = useOfflineMeetCaseData(props.matchId);
  const detail = offlineMeetCaseQuery.data;
  const status = detail?.status ?? props.summary.status;
  const responseDeadlineAt = detail?.responseDeadlineAt ?? props.summary.responseDeadlineAt;
  const cooldownUntil = detail?.cooldownUntil ?? props.summary.cooldownUntil;
  const finalCafeName = detail?.finalCafe?.name ?? props.summary.finalCafe?.name ?? null;
  const finalTimeLabel = detail?.finalTimeSlot?.label ?? props.summary.finalTimeSlot?.label ?? null;
  const options = detail?.options;
  const error = offlineMeetCaseQuery.error instanceof Error ? offlineMeetCaseQuery.error.message : null;
  const showSelectionPanel = awaitingSelectionStatuses.has(status);

  return (
    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-3 text-xs text-foreground/75">
      <p className="font-medium tracking-[0.14em] uppercase text-primary/90">Offline meet status: {status.replaceAll("_", " ")}</p>
      {responseDeadlineAt ? <p className="mt-2 inline-flex items-center gap-1"><Clock3 size={12} /> Response deadline: {new Date(responseDeadlineAt).toLocaleString()}</p> : null}
      {cooldownUntil ? <p className="mt-2">Cooldown until: {new Date(cooldownUntil).toLocaleString()}</p> : null}
      {finalCafeName && finalTimeLabel ? <p className="mt-2">Finalized at {finalCafeName} - {finalTimeLabel}</p> : null}

      {showSelectionPanel ? (
        <div className="mt-3 rounded-xl border border-primary/30 p-3">
          <p className="uppercase tracking-[0.15em] text-[10px] text-primary">Choose exactly 2 cafe options</p>
          {offlineMeetCaseQuery.isPending && !options ? <p className="mt-2 text-[10px] text-foreground/60">Loading concierge options...</p> : null}
          <div className="mt-2 grid grid-cols-1 gap-2">
            {(options?.cafes ?? []).map((cafe) => (
              <button key={cafe.id} onClick={() => props.onToggleCafe(props.matchId, cafe.id)} className={`rounded-lg border px-3 py-2 text-left text-[10px] ${props.draft.cafes.includes(cafe.id) ? "border-primary bg-primary/10" : "border-border/40"}`}>
                <p className="uppercase tracking-[0.12em]">{cafe.name}</p>
                <p className="mt-1 text-foreground/60 normal-case tracking-normal">{cafe.address}</p>
              </button>
            ))}
          </div>

          <p className="mt-3 uppercase tracking-[0.15em] text-[10px] text-primary">Choose 3 to 4 time slots</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(options?.timeSlots ?? []).map((slot) => (
              <button key={slot.id} onClick={() => props.onToggleSlot(props.matchId, slot.id)} className={`rounded-lg border px-2 py-2 text-left text-[10px] ${props.draft.timeSlots.includes(slot.id) ? "border-primary bg-primary/10" : "border-border/40"}`}>
                {slot.label}
              </button>
            ))}
          </div>

          {error ? <p className="mt-2 text-[10px] text-red-400">{error}</p> : null}
          <button onClick={() => void props.onSubmit(props.matchId)} disabled={props.pending || offlineMeetCaseQuery.isPending || !options || options.cafes.length === 0 || options.timeSlots.length === 0} className="mt-3 rounded-full border border-primary/40 px-3 py-1.5 uppercase tracking-[0.14em] text-[10px] text-primary disabled:opacity-50">{props.pending ? "Submitting..." : "Submit concierge preferences"}</button>
        </div>
      ) : null}
    </div>
  );
}

function OnlineMeetSection(props: {
  matchId: string;
  summary: NonNullable<MatchCard["onlineMeetCase"]>;
  pending: boolean;
  draft: { platform: MeetPlatform | null; timeSlots: string[] };
  onPlatformSelect: (matchId: string, platform: MeetPlatform) => void;
  onToggleSlot: (matchId: string, slotId: string) => void;
  onSubmit: (matchId: string) => Promise<void>;
}) {
  const onlineMeetCaseQuery = useOnlineMeetCaseData(props.matchId);
  const detail = onlineMeetCaseQuery.data;
  const status = detail?.status ?? props.summary.status;
  const responseDeadlineAt = detail?.responseDeadlineAt ?? props.summary.responseDeadlineAt;
  const cooldownUntil = detail?.cooldownUntil ?? props.summary.cooldownUntil;
  const finalPlatform = detail?.finalPlatform ?? props.summary.finalPlatform ?? null;
  const finalTimeLabel = detail?.finalTimeSlot?.label ?? props.summary.finalTimeSlot?.label ?? null;
  const options = detail?.options;
  const error = onlineMeetCaseQuery.error instanceof Error ? onlineMeetCaseQuery.error.message : null;
  const showSelectionPanel = awaitingSelectionStatuses.has(status);

  return (
    <div className="mt-4 rounded-2xl border border-highlight/20 bg-highlight/[0.05] p-3 text-xs text-foreground/75">
      <p className="font-medium tracking-[0.14em] uppercase text-highlight">Online meet status: {status.replaceAll("_", " ")}</p>
      {responseDeadlineAt ? <p className="mt-2 inline-flex items-center gap-1"><Clock3 size={12} /> Response deadline: {new Date(responseDeadlineAt).toLocaleString()}</p> : null}
      {cooldownUntil ? <p className="mt-2">Cooldown until: {new Date(cooldownUntil).toLocaleString()}</p> : null}
      {finalPlatform && finalTimeLabel ? <p className="mt-2">Finalized: {finalPlatform.replaceAll("_", " ")} - {finalTimeLabel}</p> : null}

      {showSelectionPanel ? (
        <div className="mt-3 rounded-xl border border-highlight/30 p-3">
          <p className="uppercase tracking-[0.15em] text-[10px] text-highlight">Select platform</p>
          {onlineMeetCaseQuery.isPending && !options ? <p className="mt-2 text-[10px] text-foreground/60">Loading online meet options...</p> : null}
          <div className="mt-2 flex gap-2">
            {(options?.platforms ?? []).map((platform) => (
              <button key={platform} onClick={() => props.onPlatformSelect(props.matchId, platform)} className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.14em] ${props.draft.platform === platform ? "border-highlight bg-highlight/10" : "border-border/40"}`}>
                {platform.replace("_", " ")}
              </button>
            ))}
          </div>

          <p className="mt-3 uppercase tracking-[0.15em] text-[10px] text-highlight">Choose 2 to 4 time slots</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(options?.timeSlots ?? []).map((slot) => (
              <button key={slot.id} onClick={() => props.onToggleSlot(props.matchId, slot.id)} className={`rounded-lg border px-2 py-2 text-left text-[10px] ${props.draft.timeSlots.includes(slot.id) ? "border-highlight bg-highlight/10" : "border-border/40"}`}>
                {slot.label}
              </button>
            ))}
          </div>

          {error ? <p className="mt-2 text-[10px] text-red-400">{error}</p> : null}
          <button onClick={() => void props.onSubmit(props.matchId)} disabled={props.pending || onlineMeetCaseQuery.isPending || !options || options.platforms.length === 0 || options.timeSlots.length === 0} className="mt-3 rounded-full border border-highlight/40 px-3 py-1.5 uppercase tracking-[0.14em] text-[10px] text-highlight disabled:opacity-50">{props.pending ? "Submitting..." : "Submit online preferences"}</button>
        </div>
      ) : null}
    </div>
  );
}
