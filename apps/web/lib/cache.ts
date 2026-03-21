"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { getQueryClient } from "@/lib/queryClient";

type CacheRecord<T> = {
  value: T;
  updatedAt: number;
};

const memoryCache = new Map<string, CacheRecord<unknown>>();
const PERSISTED_KEYS = new Set([
  "onboarding-draft",
  "profile-draft",
  "viewed-profiles"
]);

function getStorageKey(key: string) {
  return `vael-cache:${key}`;
}

function readPersisted<T>(key: string): CacheRecord<T> | null {
  if (!PERSISTED_KEYS.has(key)) return null;
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getStorageKey(key));
    if (!raw) return null;
    return JSON.parse(raw) as CacheRecord<T>;
  } catch {
    return null;
  }
}

function writePersisted<T>(key: string, record: CacheRecord<T>) {
  if (typeof window === "undefined" || !PERSISTED_KEYS.has(key)) return;
  localStorage.setItem(getStorageKey(key), JSON.stringify(record));
}

export function primeCache<T>(key: string, value: T) {
  const record = { value, updatedAt: Date.now() };
  memoryCache.set(key, record);
  writePersisted(key, record);
  getQueryClient().setQueryData([key], value);
}

export function clearAllCaches() {
  memoryCache.clear();

  if (typeof window !== "undefined") {
    const prefix = "vael-cache:";
    const keysToRemove: string[] = [];

    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      window.localStorage.removeItem(key);
    }
  }

  getQueryClient().clear();
}

export function readCache<T>(key: string): CacheRecord<T> | null {
  const queryClient = getQueryClient();
  const queryState = queryClient.getQueryState<T>([key]);
  if (queryState?.data !== undefined) {
    const live = {
      value: queryState.data,
      updatedAt: queryState.dataUpdatedAt || Date.now()
    };
    memoryCache.set(key, live);
    return live;
  }

  const memory = memoryCache.get(key) as CacheRecord<T> | undefined;
  if (memory) return memory;
  const persisted = readPersisted<T>(key);
  if (persisted) {
    memoryCache.set(key, persisted);
    queryClient.setQueryData([key], persisted.value);
  }
  return persisted;
}

export function useStaleWhileRevalidate<T>(options: {
  key: string;
  enabled: boolean;
  fetcher: () => Promise<T>;
  staleTimeMs?: number;
}) {
  const { key, enabled, fetcher, staleTimeMs = 60_000 } = options;
  const cached = useMemo(() => readCache<T>(key), [key]);

  const query = useQuery({
    queryKey: [key],
    queryFn: fetcher,
    enabled,
    staleTime: staleTimeMs,
    gcTime: Math.max(staleTimeMs * 10, 30 * 60_000),
    placeholderData: keepPreviousData,
    initialData: cached?.value,
    initialDataUpdatedAt: cached?.updatedAt
  });



  useEffect(() => {
    if (query.data !== undefined) {
      primeCache(key, query.data);
    }
  }, [key, query.data]);

  const updateAndPersist = (next: T) => {
    primeCache(key, next);
  };

  const mutate = (updater: T | ((current?: T) => T)) => {
    const current = query.data;
    const next = typeof updater === "function" ? (updater as (value?: T) => T)(current) : updater;
    updateAndPersist(next);
  };

  return {
    data: query.data,
    setData: (next: T) => updateAndPersist(next),
    refresh: async (force = false) => {
      if (!enabled) return;
      if (force) {
        const result = await query.refetch();
        if (result.data !== undefined) updateAndPersist(result.data);
        return;
      }
      const result = await query.refetch({ cancelRefetch: false });
      if (result.data !== undefined) updateAndPersist(result.data);
    },
    revalidate: async () => {
      const result = await query.refetch();
      if (result.data !== undefined) updateAndPersist(result.data);
    },
    mutate,
    isRefreshing: query.isFetching,
    isLoading: query.isLoading,
    error: query.error
  };
}
