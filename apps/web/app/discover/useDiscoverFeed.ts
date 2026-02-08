"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";

export type DiscoverFilters = {
  intent: "all" | "dating" | "friends";
  distance: number;
};

export type DiscoverProfile = {
  userId: string;
  name: string;
  age?: number | null;
  city: string;
  bioShort: string;
  primaryPhotoUrl?: string | null;
  preferences?: {
    intent?: string;
    distance?: string;
    interests?: string[];
  };
  videoVerificationStatus?: string | null;
};

export type DiscoverFeedResponse = {
  items: DiscoverProfile[];
  nextCursor?: string;
};

const DEFAULT_LIMIT = 24;

// Cursor in your API is a STRING (nextCursor?: string)
type DiscoverCursor = string | undefined;

function buildDiscoverParams(filters: DiscoverFilters, cursor?: string) {
  const params = new URLSearchParams();
  params.set("intent", filters.intent);
  if (filters.distance) params.set("distance", String(filters.distance));
  params.set("limit", String(DEFAULT_LIMIT));
  if (cursor) params.set("cursor", cursor);
  return params;
}

export function useDiscoverFeed(filters: DiscoverFilters) {
  return useInfiniteQuery<
    DiscoverFeedResponse,                 // TQueryFnData
    Error,                               // TError
    DiscoverFeedResponse,                // TData
    ReturnType<typeof queryKeys.discoverFeed>, // TQueryKey
    DiscoverCursor                       // TPageParam
  >({
    queryKey: queryKeys.discoverFeed(filters),
    initialPageParam: undefined, // IMPORTANT: matches cursor type
    queryFn: ({ pageParam }) => {
      const params = buildDiscoverParams(filters, pageParam);
      return apiFetch<DiscoverFeedResponse>(`/discover?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 15000
  });
}
