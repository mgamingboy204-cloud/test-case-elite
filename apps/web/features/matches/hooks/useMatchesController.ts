import { useMemo, useState } from "react";
import { ApiError } from "@/lib/api";
import { primeCache, useStaleWhileRevalidate } from "@/lib/cache";
import { fetchMatches, type MatchRequestType } from "@/lib/queries";
import {
  getOnlineMeet,
  getPhoneUnlock,
  initiateMatchInteractionRequest,
  requestSocialExchange,
  respondMatchConsent,
  unmatch
} from "@/lib/matches";
import { fetchOfflineMeetCase, submitOfflineMeetSelections } from "@/lib/offlineMeet";
import { fetchOnlineMeetCase, submitOnlineMeetSelections, type MeetPlatform } from "@/lib/onlineMeet";
import type { OfflineMeetDraft, OnlineMeetDraft, PendingAction } from "@/features/matches/types";
import { toConsentType, toRequestPayload } from "@/features/matches/lib/utils";

export function useMatchesController(enabled: boolean) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [offlineDraftByMatch, setOfflineDraftByMatch] = useState<Record<string, OfflineMeetDraft>>({});
  const [onlineDraftByMatch, setOnlineDraftByMatch] = useState<Record<string, OnlineMeetDraft>>({});

  const matchesQuery = useStaleWhileRevalidate({
    key: "matches",
    fetcher: fetchMatches,
    enabled,
    staleTimeMs: 45_000
  });

  const matches = useMemo(() => matchesQuery.data ?? [], [matchesQuery.data]);

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
      const response = await respondMatchConsent({
        matchId,
        type: toConsentType(type),
        response: "NO"
      });
      await matchesQuery.refresh(true);
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
      await requestSocialExchange(matchId);
      await matchesQuery.refresh(true);
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
      await fetchOfflineMeetCase(matchId);
      const draft = offlineDraftByMatch[matchId] ?? { cafes: [], timeSlots: [] };
      if (draft.cafes.length !== 2 || draft.timeSlots.length < 3 || draft.timeSlots.length > 4) {
        setFeedback("Please choose exactly 2 cafes and 3 to 4 preferred time slots.");
        return;
      }
      await submitOfflineMeetSelections(matchId, draft.cafes, draft.timeSlots);
      await matchesQuery.refresh(true);
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
    setOnlineDraftByMatch((current) => ({
      ...current,
      [matchId]: { ...(current[matchId] ?? { platform: null, timeSlots: [] }), platform }
    }));
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
      await unmatch(matchId);
      const next = matches.filter((entry) => entry.id !== matchId);
      primeCache("matches", next);
      matchesQuery.setData(next);
      setFeedback("Match closed. No additional interaction requests can be sent for this connection.");
    } catch (error) {
      setFeedback(error instanceof ApiError ? error.message : "Unable to unmatch at this moment.");
    } finally {
      setPendingAction(null);
    }
  };

  return {
    matchesQuery,
    matches,
    feedback,
    pendingAction,
    offlineDraftByMatch,
    onlineDraftByMatch,
    setFeedback,
    setPendingAction,
    runInteraction,
    runDeclineInteraction,
    runSocialRequest,
    toggleOfflineCafe,
    toggleOfflineTimeSlot,
    submitOfflineSelections,
    toggleOnlineTimeSlot,
    setOnlinePlatform,
    submitOnlineSelections,
    runUnmatch
  };
}
