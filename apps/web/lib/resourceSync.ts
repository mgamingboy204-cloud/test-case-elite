"use client";

import { applyDiscoverActionToCache } from "@/lib/discoverFeed";
import type { LikesIncomingProfile } from "@/lib/likes";
import { fetchIncomingLikes } from "@/lib/likes";
import { fetchAlerts, fetchMatches, fetchProfile } from "@/lib/queries";
import { primeCache, readCache } from "@/lib/cache";
import { getQueryClient } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";

type MemberResourceConfig<TData> = {
  cacheKey: string;
  staleTimeMs: number;
  fallbackIntervalMs: number;
  fetcher: () => Promise<TData>;
};

export const DISCOVER_BACKGROUND_SYNC_INTERVAL_MS = 10_000;
export const VERIFICATION_STATUS_FALLBACK_MS = 5_000;
export const EMPLOYEE_QUEUE_FALLBACK_MS = 5_000;
export const EMPLOYEE_COORDINATION_FALLBACK_MS = 5_000;
export const EMPLOYEE_SUMMARY_FALLBACK_MS = 10_000;
export const ADMIN_DASHBOARD_FALLBACK_MS = 15_000;
export const ADMIN_STAFF_FALLBACK_MS = 15_000;
export const ADMIN_AUDIT_FALLBACK_MS = 15_000;

export const MEMBER_RESOURCE_CONFIG = {
  likes: {
    cacheKey: "likes-incoming",
    staleTimeMs: 30_000,
    fallbackIntervalMs: 10_000,
    fetcher: fetchIncomingLikes
  },
  matches: {
    cacheKey: "matches",
    staleTimeMs: 30_000,
    fallbackIntervalMs: 5_000,
    fetcher: fetchMatches
  },
  alerts: {
    cacheKey: "alerts",
    staleTimeMs: 20_000,
    fallbackIntervalMs: 5_000,
    fetcher: fetchAlerts
  },
  profile: {
    cacheKey: "profile",
    staleTimeMs: 60_000,
    fallbackIntervalMs: 15_000,
    fetcher: fetchProfile
  }
} as const satisfies Record<string, MemberResourceConfig<unknown>>;

export type MemberResourceName = keyof typeof MEMBER_RESOURCE_CONFIG;

export type MemberResourceDataMap = {
  likes: Awaited<ReturnType<typeof fetchIncomingLikes>>;
  matches: Awaited<ReturnType<typeof fetchMatches>>;
  alerts: Awaited<ReturnType<typeof fetchAlerts>>;
  profile: Awaited<ReturnType<typeof fetchProfile>>;
};

function getMemberResourceQueryKey(name: MemberResourceName) {
  if (name === "likes") return queryKeys.member.likes.list();
  if (name === "matches") return queryKeys.member.matches.list();
  if (name === "alerts") return queryKeys.member.alerts.list();
  return queryKeys.member.profile.detail();
}

export function getMemberResourceConfig<TName extends MemberResourceName>(name: TName) {
  return MEMBER_RESOURCE_CONFIG[name] as MemberResourceConfig<MemberResourceDataMap[TName]>;
}

export function getMemberResourceNameForLiveEvent(eventType: string): MemberResourceName | null {
  if (eventType === "likes.changed") return "likes";
  if (eventType === "matches.changed") return "matches";
  if (eventType === "alerts.changed") return "alerts";
  if (eventType === "profile.changed") return "profile";
  return null;
}

export function getMemberResourceNameForRoute(href: string): MemberResourceName | null {
  if (href === "/likes") return "likes";
  if (href === "/matches") return "matches";
  if (href === "/alerts") return "alerts";
  if (href === "/profile") return "profile";
  return null;
}

export async function prefetchMemberResource<TName extends MemberResourceName>(name: TName) {
  const config = getMemberResourceConfig(name);
  if (readCache(config.cacheKey)?.value !== undefined) return;

  const queryClient = getQueryClient();
  const queryKey = getMemberResourceQueryKey(name);
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: config.fetcher
  });

  const data = queryClient.getQueryData<MemberResourceDataMap[TName]>(queryKey);
  if (data !== undefined) {
    primeCache(config.cacheKey, data);
  }
}

export async function refreshMemberResource<TName extends MemberResourceName>(name: TName) {
  const config = getMemberResourceConfig(name);
  const data = await config.fetcher();
  primeCache(config.cacheKey, data);
  getQueryClient().setQueryData(getMemberResourceQueryKey(name), data);
  return data;
}

export async function refreshMemberResources(names: MemberResourceName[]) {
  await Promise.all(names.map((name) => refreshMemberResource(name)));
}

export function removeIncomingLikeFromCache(targetUserId: string) {
  if (!targetUserId) return;

  const current = readCache<LikesIncomingProfile[]>("likes-incoming")?.value;
  const next = current?.filter((item) => item.profileId !== targetUserId) ?? [];
  if (current && next.length !== current.length) {
    primeCache("likes-incoming", next);
  }

  getQueryClient().setQueryData<LikesIncomingProfile[]>(queryKeys.member.likes.list(), (items) =>
    (items ?? []).filter((item) => item.profileId !== targetUserId)
  );
}

export function applyOptimisticMemberActionToCaches(targetUserId: string) {
  if (!targetUserId) return;
  const nextDiscoverFeed = applyDiscoverActionToCache(targetUserId);
  getQueryClient().setQueryData(queryKeys.member.discoverFeed(), nextDiscoverFeed);
  removeIncomingLikeFromCache(targetUserId);
}

export async function syncAfterMatchCreated(matchId: string | null | undefined) {
  if (!matchId) return;
  await refreshMemberResources(["likes", "matches", "alerts"]);
  const queryClient = getQueryClient();
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.member.likes.all(), refetchType: "active" }),
    queryClient.invalidateQueries({ queryKey: queryKeys.member.matches.all(), refetchType: "active" }),
    queryClient.invalidateQueries({ queryKey: queryKeys.member.alerts.all(), refetchType: "active" })
  ]);
}
