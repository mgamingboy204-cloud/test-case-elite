"use client";

import { useLiveResourceRefresh } from "@/contexts/LiveUpdatesContext";
import { useStaleWhileRevalidate } from "@/lib/cache";
import {
  getMemberResourceConfig,
  type MemberResourceDataMap,
  type MemberResourceName
} from "@/lib/resourceSync";

type ResourceQueryResult<TData> = ReturnType<typeof useStaleWhileRevalidate<TData>>;

export function useMemberResource<TName extends MemberResourceName>(
  name: TName,
  enabled: boolean
): ResourceQueryResult<MemberResourceDataMap[TName]> {
  const config = getMemberResourceConfig(name);

  const query = useStaleWhileRevalidate<MemberResourceDataMap[TName]>({
    key: config.cacheKey,
    fetcher: config.fetcher,
    enabled,
    staleTimeMs: config.staleTimeMs
  });

  useLiveResourceRefresh({
    enabled,
    refresh: () => query.refresh(true),
    fallbackIntervalMs: config.fallbackIntervalMs
  });

  return query;
}

export function useLikesResource(enabled: boolean) {
  return useMemberResource("likes", enabled);
}

export function useMatchesResource(enabled: boolean) {
  return useMemberResource("matches", enabled);
}

export function useAlertsResource(enabled: boolean) {
  return useMemberResource("alerts", enabled);
}

export function useProfileResource(enabled: boolean) {
  return useMemberResource("profile", enabled);
}
