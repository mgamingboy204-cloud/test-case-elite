"use client";

import { useCallback, useEffect, useState } from "react";

type CacheRecord<T> = {
  value: T;
  updatedAt: number;
};

const memoryCache = new Map<string, CacheRecord<unknown>>();

function getStorageKey(key: string) {
  return `elite-cache:${key}`;
}

function readPersisted<T>(key: string): CacheRecord<T> | null {
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
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(key), JSON.stringify(record));
}

export function primeCache<T>(key: string, value: T) {
  const record = { value, updatedAt: Date.now() };
  memoryCache.set(key, record);
  writePersisted(key, record);
}

export function readCache<T>(key: string): CacheRecord<T> | null {
  const memory = memoryCache.get(key) as CacheRecord<T> | undefined;
  if (memory) return memory;
  const persisted = readPersisted<T>(key);
  if (persisted) memoryCache.set(key, persisted);
  return persisted;
}

export function useStaleWhileRevalidate<T>(options: {
  key: string;
  enabled: boolean;
  fetcher: () => Promise<T>;
  staleTimeMs?: number;
}) {
  const { key, enabled, fetcher, staleTimeMs = 60_000 } = options;
  const cached = readCache<T>(key);
  const [data, setData] = useState<T | undefined>(cached?.value);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async (force = false) => {
    if (!enabled) return;
    const current = readCache<T>(key);
    const isStale = !current || Date.now() - current.updatedAt > staleTimeMs;
    if (!force && !isStale) return;

    setIsRefreshing(true);
    try {
      const next = await fetcher();
      primeCache(key, next);
      setData(next);
    } finally {
      setIsRefreshing(false);
    }
  }, [enabled, fetcher, key, staleTimeMs]);

  useEffect(() => {
    if (enabled) {
      const current = readCache<T>(key);
      if (current) setData(current.value);
      void refresh();
    }
  }, [enabled, key, refresh]);

  return { data, setData, refresh, isRefreshing };
}
