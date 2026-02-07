"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";

export type DiscoverFilters = {
  gender: "all" | "male" | "female";
  intent: "all" | "dating" | "friends";
  ageMin: number;
  ageMax: number;
  distance: number;
};

export type DiscoverProfile = {
  userId: string;
  name: string;
  gender: string;
  age: number;
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

function buildDiscoverParams(filters: DiscoverFilters, cursor?: string | number) {
  const params = new URLSearchParams();
  if (filters.gender !== "all") params.set("gender", filters.gender);
  if (filters.intent !== "all") params.set("intent", filters.intent);
  if (filters.ageMin) params.set("minAge", String(filters.ageMin));
  if (filters.ageMax) params.set("maxAge", String(filters.ageMax));
  if (filters.distance) params.set("distance", String(filters.distance));
  params.set("limit", String(DEFAULT_LIMIT));
  params.set("mode", filters.intent === "friends" ? "friends" : "dating");
  if (cursor !== undefined && cursor !== null && cursor !== "") params.set("cursor", String(cursor));
  return params;
}

export function useDiscoverFeed(filters: DiscoverFilters) {
  return useInfiniteQuery<DiscoverFeedResponse>({
    queryKey: queryKeys.discoverFeed(filters),
    queryFn: ({ pageParam }) => {
      const params = buildDiscoverParams(filters, pageParam);
      return apiFetch<DiscoverFeedResponse>(`/discover?${params.toString()}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: 0,
    staleTime: 15000
  });
}
