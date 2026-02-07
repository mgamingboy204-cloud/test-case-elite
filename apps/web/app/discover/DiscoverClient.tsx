"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { apiFetch } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";

import RouteGuard from "../components/RouteGuard";
import ThemeToggle from "../components/ThemeToggle";
import AppShellLayout from "../components/ui/AppShellLayout";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";

import DiscoverCard from "./components/DiscoverCard";
import DiscoverFilters from "./components/DiscoverFilters";
import {
  type DiscoverFilters as DiscoverFiltersState,
  type DiscoverFeedResponse,
  useDiscoverFeed
} from "./useDiscoverFeed";

/* -------------------- DEFAULT FILTERS -------------------- */

const defaultFilters: DiscoverFiltersState = {
  gender: "all",
  intent: "dating",
  ageMin: 24,
  ageMax: 38,
  distance: 25
};

/* -------------------- HELPERS -------------------- */

function parseFilters(params: URLSearchParams): DiscoverFiltersState {
  const gender = params.get("gender");
  const intent = params.get("intent");
  const ageMin = Number(params.get("ageMin"));
  const ageMax = Number(params.get("ageMax"));
  const distance = Number(params.get("distance"));

  return {
    gender: gender === "male" || gender === "female" ? gender : "all",
    intent: intent === "friends" || intent === "all" ? intent : "dating",
    ageMin: Number.isFinite(ageMin) && ageMin >= 18 ? ageMin : defaultFilters.ageMin,
    ageMax: Number.isFinite(ageMax) && ageMax >= 18 ? ageMax : defaultFilters.ageMax,
    distance: Number.isFinite(distance) && distance > 0 ? distance : defaultFilters.distance
  };
}

function buildFilterSearch(filters: DiscoverFiltersState) {
  const params = new URLSearchParams();
  if (filters.gender !== "all") params.set("gender", filters.gender);
  if (filters.intent !== "dating") params.set("intent", filters.intent);
  if (filters.ageMin !== defaultFilters.ageMin) params.set("ageMin", String(filters.ageMin));
  if (filters.ageMax !== defaultFilters.ageMax) params.set("ageMax", String(filters.ageMax));
  if (filters.distance !== defaultFilters.distance) params.set("distance", String(filters.distance));
  return params.toString();
}

function shuffleIds(ids: string[], avoid?: string | null) {
  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  if (avoid && arr[0] === avoid && arr.length > 1) {
    const idx = arr.findIndex((id) => id !== avoid);
    if (idx > 0) [arr[0], arr[idx]] = [arr[idx], arr[0]];
  }
  return arr;
}

/* -------------------- COMPONENT -------------------- */

export default function DiscoverClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  /* ---------- FILTER STATE ---------- */

  const initialFilters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    const qs = buildFilterSearch(filters);
    router.replace(qs ? `/discover?${qs}` : "/discover");
  }, [filters, router]);

  /* ---------- FEED STATE ---------- */

  const discoverQuery = useDiscoverFeed(filters);

  const feedItems = useMemo(() => {
    const data = discoverQuery.data as InfiniteData<DiscoverFeedResponse> | undefined;
    return data?.pages.flatMap((p) => p.items ?? []) ?? [];
  }, [discoverQuery.data]);

  const profileMap = useMemo(
    () => new Map(feedItems.map((p) => [p.userId, p])),
    [feedItems]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [cycleOrder, setCycleOrder] = useState<string[]>([]);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [lastSwipedId, setLastSwipedId] = useState<string | null>(null);

  const hasNextPage = Boolean(discoverQuery.hasNextPage);
  const shouldCycle = !hasNextPage && feedItems.length > 0;

  useEffect(() => {
    setActiveIndex(0);
    setCycleOrder([]);
    setCycleIndex(0);
    setLastSwipedId(null);
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (hasNextPage && feedItems.length - activeIndex < 6) {
      void discoverQuery.fetchNextPage();
    }
  }, [activeIndex, feedItems.length, hasNextPage, discoverQuery]);

  useEffect(() => {
    if (shouldCycle && activeIndex >= feedItems.length && !cycleOrder.length) {
      setCycleOrder(shuffleIds(feedItems.map((p) => p.userId), lastSwipedId));
      setCycleIndex(0);
    }
  }, [shouldCycle, activeIndex, feedItems, cycleOrder.length, lastSwipedId]);

  useEffect(() => {
    if (shouldCycle && cycleIndex >= cycleOrder.length && cycleOrder.length) {
      setCycleOrder(shuffleIds(cycleOrder, lastSwipedId));
      setCycleIndex(0);
    }
  }, [cycleIndex, cycleOrder, shouldCycle, lastSwipedId]);

  const activeProfile = useMemo(() => {
    if (activeIndex < feedItems.length) return feedItems[activeIndex];
    if (!shouldCycle) return undefined;
    return profileMap.get(cycleOrder[cycleIndex]);
  }, [activeIndex, feedItems, shouldCycle, cycleOrder, cycleIndex, profileMap]);

  /* ---------- SWIPE ---------- */

  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  const likeMutation = useMutation({
    mutationFn: ({ targetUserId, action }: { targetUserId: string; action: "LIKE" | "PASS" }) =>
      apiFetch("/likes", {
        method: "POST",
        body: JSON.stringify({ toUserId: targetUserId, type: action })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discoverFeed"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsCount });
    }
  });

  function advance(swipedId: string) {
    setLastSwipedId(swipedId);
    if (activeIndex < feedItems.length) setActiveIndex((i) => i + 1);
    else setCycleIndex((i) => i + 1);
  }

  function handleSwipe(action: "LIKE" | "PASS") {
    if (!activeProfile || isAnimating) return;
    setIsAnimating(true);
    setSwipeDirection(action === "LIKE" ? "right" : "left");

    likeMutation.mutate({ targetUserId: activeProfile.userId, action });

    setTimeout(() => {
      advance(activeProfile.userId);
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 320);
  }

  /* -------------------- RENDER -------------------- */

  return (
    <RouteGuard requireActive>
      <AppShellLayout
        rightPanel={
          <Card>
            <h3>Filters</h3>
            <DiscoverFilters
              filters={filters}
              onChange={setFilters}
              onRefresh={() => discoverQuery.refetch()}
              isRefreshing={discoverQuery.isFetching}
            />
          </Card>
        }
      >
        <div className="discover-page">
          <div className="discover-feed">
            {discoverQuery.isLoading && !feedItems.length ? (
              <LoadingState message="Loading profiles…" />
            ) : discoverQuery.isError ? (
              <ErrorState
                message="Unable to load profiles"
                onRetry={() => discoverQuery.refetch()}
              />
            ) : activeProfile ? (
              <>
                <DiscoverCard
                  profile={activeProfile}
                  isActive
                  isAnimating={isAnimating}
                  swipeDirection={swipeDirection}
                />
                <div className="discover-actions">
                  <button onClick={() => handleSwipe("PASS")}>✕</button>
                  <button onClick={() => handleSwipe("LIKE")}>❤</button>
                </div>
              </>
            ) : (
              <EmptyState title="No profiles" message="Check back later." />
            )}
          </div>

          <ThemeToggle variant="switch" label="Toggle dark mode" />
        </div>
      </AppShellLayout>
    </RouteGuard>
  );
}
