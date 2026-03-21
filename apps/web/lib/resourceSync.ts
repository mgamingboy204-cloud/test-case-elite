"use client";

import { fetchIncomingLikes } from "@/lib/likes";
import { fetchAlerts, fetchMatches, fetchProfile } from "@/lib/queries";
import { primeCache, readCache } from "@/lib/cache";
import { getQueryClient } from "@/lib/queryClient";

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
export const ADMIN_DASHBOARD_FALLBACK_MS = 15_000;

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
  await queryClient.prefetchQuery({
    queryKey: [config.cacheKey],
    queryFn: config.fetcher
  });

  const data = queryClient.getQueryData<MemberResourceDataMap[TName]>([config.cacheKey]);
  if (data !== undefined) {
    primeCache(config.cacheKey, data);
  }
}

export async function refreshMemberResource<TName extends MemberResourceName>(name: TName) {
  const config = getMemberResourceConfig(name);
  const data = await config.fetcher();
  primeCache(config.cacheKey, data);
  return data;
}

export async function refreshMemberResources(names: MemberResourceName[]) {
  await Promise.all(names.map((name) => refreshMemberResource(name)));
}

export async function syncAfterMatchCreated(matchId: string | null | undefined) {
  if (!matchId) return;
  await refreshMemberResources(["matches", "alerts"]);
}
