"use client";

import { Loader2, RefreshCcw, ShieldCheck, UserMinus, Clock3 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeApiError } from "@/lib/apiErrors";
import { ProtectedState } from "@/components/ui/protected-state";
import { PhoneExchangePanel } from "@/features/matches/components/PhoneExchangePanel";
import { SocialExchangePanel } from "@/features/matches/components/SocialExchangePanel";
import { OfflineMeetSelectionPanel, OnlineMeetSelectionPanel } from "@/features/matches/components/MeetSelectionPanels";
import { useMatchesController } from "@/features/matches/hooks/useMatchesController";
import { canEditMeetSelections, interactionMeta, normalizeSocialCase, statusLabel, toAwaitingResponse } from "@/features/matches/lib/utils";
import type { PendingAction } from "@/features/matches/types";

export function MatchesFeature() {
  const { isAuthenticated, onboardingStep, user } = useAuth();
  const controller = useMatchesController(isAuthenticated && onboardingStep === "COMPLETED");

  if (!isAuthenticated || onboardingStep !== "COMPLETED") return null;

  if (controller.matchesQuery.error && !controller.matchesQuery.data) {
    const normalized = normalizeApiError(controller.matchesQuery.error);
    return <ProtectedState title="Matches unavailable" description={normalized.message} />;
  }

  return (
    <div className="w-full px-6 md:px-8 pt-8 pb-8">
      <div className="pb-8 text-center">
        <h1 className="text-xl tracking-[0.38em] font-medium text-primary uppercase">Matches</h1>
        <p className="mt-2 text-xs text-foreground/55">Private mutual connections managed with concierge-led interaction options.</p>
      </div>

      {controller.feedback ? <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-foreground/75">{controller.feedback}</div> : null}

      {controller.matchesQuery.isRefreshing && controller.matches.length === 0 ? <div className="space-y-4">{[1, 2].map((key) => <div key={key} className="rounded-3xl border border-border/50 bg-foreground/[0.03] p-4 animate-pulse"><div className="h-52 w-full rounded-2xl bg-foreground/10" /><div className="mt-4 h-4 w-40 rounded bg-foreground/10" /><div className="mt-3 h-3 w-full rounded bg-foreground/10" /></div>)}</div> : null}

      {!controller.matchesQuery.isRefreshing && controller.matchesQuery.data === undefined ? <div className="rounded-3xl border border-border/40 bg-foreground/[0.02] p-6 text-center"><p className="text-sm text-foreground/70">We could not load your matches right now.</p><button onClick={() => void controller.matchesQuery.refresh(true)} className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-primary"><RefreshCcw size={14} /> Retry</button></div> : null}

      {!controller.matchesQuery.isRefreshing && controller.matches.length === 0 && controller.matchesQuery.data !== undefined ? <div className="rounded-3xl border border-border/40 bg-foreground/[0.02] p-8 text-center"><ShieldCheck className="mx-auto mb-3 text-primary/70" size={28} /><p className="text-sm text-foreground/75">No active matches yet.</p><p className="mt-2 text-xs text-foreground/55">Mutual likes from verified members will appear here discreetly.</p></div> : null}

      <div className="space-y-5">
        {controller.matches.map((match) => (
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
                  const busy = controller.pendingAction === actionKey;
                  const awaitingResponse = toAwaitingResponse(interaction);
                  const disabled = busy || (!interaction.canInitiate && !awaitingResponse);

                  return (
                    <div key={type} className="rounded-xl border border-border/40 bg-background/60 px-3 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-sm text-foreground/85"><Icon size={16} className="text-primary" />{label}</span>
                        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-foreground/55">{busy ? <Loader2 size={12} className="animate-spin" /> : null}{statusLabel(interaction)}</span>
                      </div>
                      {awaitingResponse ? (
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => void controller.runInteraction(match.id, type)} disabled={busy} className="rounded-full border border-primary/35 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Accept</button>
                          <button onClick={() => void controller.runDeclineInteraction(match.id, type)} disabled={busy} className="rounded-full border border-border/50 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-foreground/70 disabled:opacity-50">Decline</button>
                        </div>
                      ) : (
                        <button onClick={() => void controller.runInteraction(match.id, type)} disabled={disabled} className="mt-2 rounded-full border border-primary/35 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-primary disabled:opacity-50">Request</button>
                      )}
                    </div>
                  );
                })}
              </div>

              <PhoneExchangePanel
                matchId={match.id}
                currentUserId={user?.id ?? ""}
                phoneCase={match.phoneExchangeCase}
                pending={controller.pendingAction === `${match.id}:PHONE_EXCHANGE`}
                onRequest={() => controller.runInteraction(match.id, "PHONE_EXCHANGE")}
                onFeedback={controller.setFeedback}
                onRefresh={() => controller.matchesQuery.refresh(true)}
                onActionStart={() => controller.setPendingAction(`${match.id}:PHONE_EXCHANGE`)}
                onActionEnd={() => controller.setPendingAction(null)}
              />

              <SocialExchangePanel
                matchId={match.id}
                currentUserId={user?.id ?? ""}
                socialCase={normalizeSocialCase(match.socialExchangeCase ?? null, user?.id ?? "")}
                pending={controller.pendingAction === `social:${match.id}`}
                onRequest={controller.runSocialRequest}
                onActionStart={() => controller.setPendingAction(`social:${match.id}`)}
                onActionEnd={() => controller.setPendingAction(null)}
                onRefresh={() => controller.matchesQuery.refresh(true)}
                onFeedback={controller.setFeedback}
              />

              {match.offlineMeetCase ? (
                <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/[0.04] p-3 text-xs text-foreground/75">
                  <p className="font-medium tracking-[0.14em] uppercase text-primary/90">Offline meet status: {match.offlineMeetCase.status.replaceAll("_", " ")}</p>
                  {match.offlineMeetCase.responseDeadlineAt ? <p className="mt-2 inline-flex items-center gap-1"><Clock3 size={12} /> Response deadline: {new Date(match.offlineMeetCase.responseDeadlineAt).toLocaleString()}</p> : null}
                  {match.offlineMeetCase.cooldownUntil ? <p className="mt-2">Cooldown until: {new Date(match.offlineMeetCase.cooldownUntil).toLocaleString()}</p> : null}
                  {match.offlineMeetCase.finalCafe && match.offlineMeetCase.finalTimeSlot ? <p className="mt-2">Finalized at {match.offlineMeetCase.finalCafe.name} — {match.offlineMeetCase.finalTimeSlot.label}</p> : null}
                  {canEditMeetSelections(match.offlineMeetCase.status) ? <OfflineMeetSelectionPanel matchId={match.id} pending={controller.pendingAction === `offline:${match.id}`} draft={controller.offlineDraftByMatch[match.id] ?? { cafes: [], timeSlots: [] }} onToggleCafe={controller.toggleOfflineCafe} onToggleSlot={controller.toggleOfflineTimeSlot} onSubmit={controller.submitOfflineSelections} /> : null}
                </div>
              ) : null}

              {match.onlineMeetCase ? (
                <div className="mt-4 rounded-2xl border border-highlight/20 bg-highlight/[0.05] p-3 text-xs text-foreground/75">
                  <p className="font-medium tracking-[0.14em] uppercase text-highlight">Online meet status: {match.onlineMeetCase.status.replaceAll("_", " ")}</p>
                  {match.onlineMeetCase.responseDeadlineAt ? <p className="mt-2 inline-flex items-center gap-1"><Clock3 size={12} /> Response deadline: {new Date(match.onlineMeetCase.responseDeadlineAt).toLocaleString()}</p> : null}
                  {match.onlineMeetCase.cooldownUntil ? <p className="mt-2">Cooldown until: {new Date(match.onlineMeetCase.cooldownUntil).toLocaleString()}</p> : null}
                  {match.onlineMeetCase.finalPlatform && match.onlineMeetCase.finalTimeSlot ? <p className="mt-2">Finalized: {match.onlineMeetCase.finalPlatform.replaceAll("_", " ")} — {match.onlineMeetCase.finalTimeSlot.label}</p> : null}
                  {canEditMeetSelections(match.onlineMeetCase.status) ? <OnlineMeetSelectionPanel matchId={match.id} pending={controller.pendingAction === `online:${match.id}`} draft={controller.onlineDraftByMatch[match.id] ?? { platform: null, timeSlots: [] }} onToggleSlot={controller.toggleOnlineTimeSlot} onPlatformSelect={controller.setOnlinePlatform} onSubmit={controller.submitOnlineSelections} /> : null}
                </div>
              ) : null}

              <button onClick={() => void controller.runUnmatch(match.id)} disabled={controller.pendingAction === `unmatch:${match.id}`} className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-full border border-primary/25 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-foreground/70 disabled:opacity-50">{controller.pendingAction === `unmatch:${match.id}` ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={14} />} Unmatch</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
