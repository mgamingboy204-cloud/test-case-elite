"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { apiRequestAuth } from "@/lib/api";
import { primeCache, readCache } from "@/lib/cache";
import { applyOptimisticMemberActionToCaches, syncAfterMatchCreated } from "@/lib/resourceSync";
import { useLiveQueryResourceSync } from "@/lib/liveQueryResources";
import { invalidateQueryKeys, removeById } from "@/lib/queryDataUtils";
import { queryKeys } from "@/lib/queryKeys";
import {
  fetchIncomingLikes,
  respondToIncomingLike,
  sendLikeAction,
  type LikesIncomingProfile
} from "@/lib/likes";
import {
  getPhoneUnlock,
  initiateMatchInteractionRequest,
  requestSocialExchange,
  respondMatchConsent,
  respondSocialExchange,
  revealSocialExchange,
  submitSocialExchangeHandle,
  unmatch,
  type MatchInteractionType,
  type MatchConsentType,
  type SocialExchangeCase
} from "@/lib/matches";
import {
  submitOfflineMeetSelections,
  fetchOfflineMeetCase,
  type OfflineMeetCase
} from "@/lib/offlineMeet";
import {
  fetchOnlineMeetCase,
  submitOnlineMeetSelections,
  type MeetPlatform,
  type OnlineMeetCase
} from "@/lib/onlineMeet";
import {
  fetchAlerts,
  fetchMatches,
  fetchProfile,
  type Alert,
  type MatchCard,
  type ProfileViewModel
} from "@/lib/queries";

type VerificationPayload = {
  status: "NOT_REQUESTED" | "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "ESCALATED";
  displayStatus: "PENDING" | "ASSIGNED" | "APPROVED" | "REJECTED";
  meetUrl: string | null;
  remainingSeconds: number;
  requestedAt: string | null;
  escalationRequestedAt: string | null;
};

function useLegacyCacheBridge<TData>(legacyKey: string, data: TData | undefined) {
  useEffect(() => {
    if (data !== undefined) {
      primeCache(legacyKey, data);
    }
  }, [data, legacyKey]);
}

async function fetchVerificationStatus() {
  return apiRequestAuth<VerificationPayload>(API_ENDPOINTS.verification.status);
}

export function useLikesData(enabled = true) {
  const queryKey = queryKeys.member.likes.list();
  const query = useQuery({
    queryKey,
    queryFn: fetchIncomingLikes,
    enabled,
    initialData: readCache<LikesIncomingProfile[]>("likes-incoming")?.value
  });

  useLegacyCacheBridge("likes-incoming", query.data);
  useLiveQueryResourceSync({
    enabled,
    resource: "member.likes",
    queryKey
  });

  return query;
}

export function useMatchesData(enabled = true) {
  const queryKey = queryKeys.member.matches.list();
  const query = useQuery({
    queryKey,
    queryFn: fetchMatches,
    enabled,
    initialData: readCache<MatchCard[]>("matches")?.value
  });

  useLegacyCacheBridge("matches", query.data);
  useLiveQueryResourceSync({
    enabled,
    resource: "member.matches",
    queryKey
  });

  return query;
}

export function useAlertsData(enabled = true) {
  const queryKey = queryKeys.member.alerts.list();
  const query = useQuery({
    queryKey,
    queryFn: fetchAlerts,
    enabled,
    initialData: readCache<Alert[]>("alerts")?.value
  });

  useLegacyCacheBridge("alerts", query.data);
  useLiveQueryResourceSync({
    enabled,
    resource: "member.alerts",
    queryKey
  });

  return query;
}

export function useProfileData(enabled = true) {
  const queryKey = queryKeys.member.profile.detail();
  const query = useQuery({
    queryKey,
    queryFn: fetchProfile,
    enabled,
    initialData: readCache<ProfileViewModel>("profile")?.value
  });

  useLegacyCacheBridge("profile", query.data);
  useLiveQueryResourceSync({
    enabled,
    resource: "member.profile",
    queryKey
  });

  return query;
}

export function useVerificationStatusData(enabled = true) {
  const queryKey = queryKeys.member.verification.status();
  const query = useQuery({
    queryKey,
    queryFn: fetchVerificationStatus,
    enabled
  });

  useLiveQueryResourceSync({
    enabled,
    resource: "member.verificationStatus",
    queryKey
  });

  return query;
}

export function useOfflineMeetCaseData(matchId: string | null, enabled = true) {
  const queryKey = queryKeys.member.offlineMeet.case(matchId ?? "__none__");
  const query = useQuery({
    queryKey,
    queryFn: async () => fetchOfflineMeetCase(matchId ?? ""),
    enabled: enabled && Boolean(matchId)
  });

  useLiveQueryResourceSync({
    enabled: enabled && Boolean(matchId),
    resource: "member.offlineMeetCase",
    queryKey
  });

  return query;
}

export function useOnlineMeetCaseData(matchId: string | null, enabled = true) {
  const queryKey = queryKeys.member.onlineMeet.case(matchId ?? "__none__");
  const query = useQuery({
    queryKey,
    queryFn: async () => fetchOnlineMeetCase(matchId ?? ""),
    enabled: enabled && Boolean(matchId)
  });

  useLiveQueryResourceSync({
    enabled: enabled && Boolean(matchId),
    resource: "member.onlineMeetCase",
    queryKey
  });

  return query;
}

export function useRespondToIncomingLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: respondToIncomingLike,
    onMutate: async ({ targetUserId }) => {
      const previousLikes = queryClient.getQueryData<LikesIncomingProfile[]>(queryKeys.member.likes.list());
      queryClient.setQueryData<LikesIncomingProfile[]>(queryKeys.member.likes.list(), (current) =>
        (current ?? []).filter((item) => item.profileId !== targetUserId)
      );
      applyOptimisticMemberActionToCaches(targetUserId);
      return { previousLikes };
    },
    onSuccess: async (result) => {
      await invalidateQueryKeys(queryClient, [
        queryKeys.member.likes.all(),
        queryKeys.member.matches.all(),
        queryKeys.member.alerts.all()
      ]);
      if (result.matchId) {
        await syncAfterMatchCreated(result.matchId);
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousLikes) {
        queryClient.setQueryData(queryKeys.member.likes.list(), context.previousLikes);
        primeCache("likes-incoming", context.previousLikes);
      }
    }
  });
}

export function useSendLikeActionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendLikeAction,
    onSuccess: async (result) => {
      await invalidateQueryKeys(queryClient, [
        queryKeys.member.likes.all(),
        queryKeys.member.matches.all(),
        queryKeys.member.alerts.all()
      ]);
      if (result.matchId) {
        await syncAfterMatchCreated(result.matchId);
      }
    }
  });
}

export function useMarkAlertReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) =>
      apiRequestAuth<{ alertId: string; updatedCount: number; unreadCount: number }>(
        API_ENDPOINTS.alerts.markRead(alertId),
        { method: "POST" }
      ),
    onMutate: async (alertId) => {
      const previousAlerts = queryClient.getQueryData<Alert[]>(queryKeys.member.alerts.list());
      queryClient.setQueryData<Alert[]>(queryKeys.member.alerts.list(), (current) =>
        (current ?? []).map((entry) => (entry.id === alertId ? { ...entry, isUnread: false } : entry))
      );
      return { previousAlerts };
    },
    onSuccess: async () => {
      await invalidateQueryKeys(queryClient, [queryKeys.member.alerts.all()]);
    },
    onError: (_error, _variables, context) => {
      if (context?.previousAlerts) {
        queryClient.setQueryData(queryKeys.member.alerts.list(), context.previousAlerts);
        primeCache("alerts", context.previousAlerts);
      }
    }
  });
}

export function useMarkAllAlertsReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiRequestAuth<{ updatedCount: number; unreadCount: number }>("/alerts/read-all", {
        method: "POST"
      }),
    onMutate: async () => {
      const previousAlerts = queryClient.getQueryData<Alert[]>(queryKeys.member.alerts.list());
      queryClient.setQueryData<Alert[]>(queryKeys.member.alerts.list(), (current) =>
        (current ?? []).map((entry) => ({ ...entry, isUnread: false }))
      );
      return { previousAlerts };
    },
    onSuccess: async () => {
      await invalidateQueryKeys(queryClient, [queryKeys.member.alerts.all()]);
    },
    onError: (_error, _variables, context) => {
      if (context?.previousAlerts) {
        queryClient.setQueryData(queryKeys.member.alerts.list(), context.previousAlerts);
        primeCache("alerts", context.previousAlerts);
      }
    }
  });
}

async function invalidateMemberMatchQueries(queryClient: ReturnType<typeof useQueryClient>) {
  await invalidateQueryKeys(queryClient, [
    queryKeys.member.matches.all(),
    queryKeys.member.alerts.all(),
    queryKeys.member.likes.all()
  ]);
}

export function useInitiateMatchInteractionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matchId,
      type,
      payload
    }: {
      matchId: string;
      type: MatchInteractionType;
      payload?: Record<string, unknown>;
    }) => initiateMatchInteractionRequest({ matchId, type, payload }),
    onSuccess: async (_result, variables) => {
      if (variables.type === "OFFLINE_MEET") {
        await invalidateQueryKeys(queryClient, [queryKeys.member.offlineMeet.case(variables.matchId)]);
      }
      if (variables.type === "ONLINE_MEET") {
        await invalidateQueryKeys(queryClient, [queryKeys.member.onlineMeet.case(variables.matchId)]);
      }
      await invalidateMemberMatchQueries(queryClient);
    }
  });
}

export function useRespondMatchConsentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matchId,
      response,
      type,
      payload
    }: {
      matchId: string;
      response: "YES" | "NO";
      type: MatchConsentType;
      payload?: Record<string, unknown>;
    }) => respondMatchConsent({ matchId, response, type, payload }),
    onSuccess: async (_result, variables) => {
      if (variables.type === "OFFLINE_MEET") {
        await invalidateQueryKeys(queryClient, [queryKeys.member.offlineMeet.case(variables.matchId)]);
      }
      if (variables.type === "ONLINE_MEET") {
        await invalidateQueryKeys(queryClient, [queryKeys.member.onlineMeet.case(variables.matchId)]);
      }
      await invalidateMemberMatchQueries(queryClient);
    }
  });
}

export function useRequestSocialExchangeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestSocialExchange,
    onSuccess: async () => {
      await invalidateMemberMatchQueries(queryClient);
    }
  });
}

export function useRespondSocialExchangeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, response }: { caseId: string; response: "ACCEPT" | "REJECT" }) =>
      respondSocialExchange(caseId, response),
    onSuccess: async () => {
      await invalidateMemberMatchQueries(queryClient);
    }
  });
}

export function useSubmitSocialExchangeHandleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      platform,
      handle
    }: {
      caseId: string;
      platform: "Snapchat" | "Instagram" | "LinkedIn";
      handle: string;
    }) => submitSocialExchangeHandle(caseId, platform, handle),
    onSuccess: async () => {
      await invalidateMemberMatchQueries(queryClient);
    }
  });
}

export function useRevealSocialExchangeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: revealSocialExchange,
    onSuccess: async () => {
      await invalidateMemberMatchQueries(queryClient);
    }
  });
}

export function useGetPhoneUnlockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: getPhoneUnlock,
    onSuccess: async () => {
      await invalidateMemberMatchQueries(queryClient);
    }
  });
}

export function useSubmitOfflineMeetSelectionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ matchId, cafes, timeSlots }: { matchId: string; cafes: string[]; timeSlots: string[] }) =>
      submitOfflineMeetSelections(matchId, cafes, timeSlots),
    onSuccess: async (_result, variables) => {
      await invalidateQueryKeys(queryClient, [queryKeys.member.offlineMeet.case(variables.matchId)]);
      await invalidateMemberMatchQueries(queryClient);
    }
  });
}

export function useSubmitOnlineMeetSelectionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      matchId,
      platform,
      timeSlots
    }: {
      matchId: string;
      platform: MeetPlatform;
      timeSlots: string[];
    }) => submitOnlineMeetSelections(matchId, { platform, timeSlots }),
    onSuccess: async (_result, variables) => {
      await invalidateQueryKeys(queryClient, [queryKeys.member.onlineMeet.case(variables.matchId)]);
      await invalidateMemberMatchQueries(queryClient);
    }
  });
}

export function useUnmatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unmatch,
    onSuccess: async (result) => {
      queryClient.setQueryData<MatchCard[]>(queryKeys.member.matches.list(), (current) =>
        removeById(current, result.matchId)
      );
      await invalidateQueryKeys(queryClient, [
        queryKeys.member.offlineMeet.case(result.matchId),
        queryKeys.member.onlineMeet.case(result.matchId),
        queryKeys.member.matches.all(),
        queryKeys.member.alerts.all()
      ]);
    }
  });
}

export type { Alert, MatchCard, OfflineMeetCase, OnlineMeetCase, ProfileViewModel, SocialExchangeCase, VerificationPayload };
