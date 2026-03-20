"use client";

import { primeCache, readCache } from "@/lib/cache";
import type { DiscoverCard } from "@/lib/queries";

export const DISCOVER_CACHE_KEY = "discover-feed";
const MAX_ACTED_ON_IDS = 500;

export type DiscoverFilters = {
  city?: string;
  age?: number;
};

export type DiscoverFeedState = {
  cards: DiscoverCard[];
  nextCursor?: string;
  filters: DiscoverFilters;
  actedOnIds: string[];
};

function sanitizeIds(values: string[] | undefined) {
  return Array.from(new Set((values ?? []).filter(Boolean))).slice(-MAX_ACTED_ON_IDS);
}

function sanitizeState(state: Partial<DiscoverFeedState> | null | undefined): DiscoverFeedState {
  return {
    cards: Array.isArray(state?.cards) ? state.cards : [],
    nextCursor: typeof state?.nextCursor === "string" ? state.nextCursor : undefined,
    filters: {
      city: typeof state?.filters?.city === "string" && state.filters.city.trim() ? state.filters.city.trim() : undefined,
      age: typeof state?.filters?.age === "number" && Number.isFinite(state.filters.age) ? state.filters.age : undefined
    },
    actedOnIds: sanitizeIds(state?.actedOnIds)
  };
}

export function createEmptyDiscoverFeedState(filters?: DiscoverFilters): DiscoverFeedState {
  return sanitizeState({
    cards: [],
    nextCursor: undefined,
    filters,
    actedOnIds: []
  });
}

export function readDiscoverFeedState() {
  const cached = readCache<DiscoverFeedState>(DISCOVER_CACHE_KEY)?.value;
  return sanitizeState(cached);
}

export function writeDiscoverFeedState(state: DiscoverFeedState) {
  const next = sanitizeState(state);
  primeCache(DISCOVER_CACHE_KEY, next);
  return next;
}

export function mergeDiscoverFeedPage(state: DiscoverFeedState, incomingCards: DiscoverCard[], nextCursor?: string) {
  const hiddenIds = new Set(state.actedOnIds);
  const existingIds = new Set(state.cards.map((card) => card.id));
  const merged = [
    ...state.cards,
    ...incomingCards.filter((card) => !hiddenIds.has(card.id) && !existingIds.has(card.id))
  ];

  return sanitizeState({
    ...state,
    cards: merged,
    nextCursor
  });
}

export function replaceDiscoverFeedPage(state: DiscoverFeedState, incomingCards: DiscoverCard[], nextCursor?: string, filters?: DiscoverFilters) {
  const hiddenIds = new Set(state.actedOnIds);
  return sanitizeState({
    ...state,
    cards: incomingCards.filter((card) => !hiddenIds.has(card.id)),
    nextCursor,
    filters: filters ?? state.filters
  });
}

export function applyDiscoverActionToState(state: DiscoverFeedState, targetUserId: string) {
  if (!targetUserId) return sanitizeState(state);

  const actedOnIds = sanitizeIds([...state.actedOnIds, targetUserId]);
  return sanitizeState({
    ...state,
    cards: state.cards.filter((card) => card.id !== targetUserId),
    actedOnIds
  });
}

export function applyDiscoverActionToCache(targetUserId: string) {
  const current = readDiscoverFeedState();
  return writeDiscoverFeedState(applyDiscoverActionToState(current, targetUserId));
}
