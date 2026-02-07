"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { type DiscoverFilters as DiscoverFiltersState, useDiscoverFeed } from "./useDiscoverFeed";

const defaultFilters: DiscoverFiltersState = {
  gender: "all",
  intent: "dating",
  ageMin: 24,
  ageMax: 38,
  distance: 25
};

function parseFilters(params: URLSearchParams): DiscoverFiltersState {
  const genderParam = params.get("gender");
  const intentParam = params.get("intent");
  const ageMinParam = Number(params.get("ageMin"));
  const ageMaxParam = Number(params.get("ageMax"));
  const distanceParam = Number(params.get("distance"));

  return {
    gender: genderParam === "male" || genderParam === "female" ? genderParam : defaultFilters.gender,
    intent: intentParam === "friends" || intentParam === "all" || intentParam === "dating" ? intentParam : "dating",
    ageMin: Number.isFinite(ageMinParam) && ageMinParam >= 18 ? ageMinParam : defaultFilters.ageMin,
    ageMax: Number.isFinite(ageMaxParam) && ageMaxParam >= 18 ? ageMaxParam : defaultFilters.ageMax,
    distance: Number.isFinite(distanceParam) && distanceParam > 0 ? distanceParam : defaultFilters.distance
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

function shuffleIds(ids: string[], avoidFirstId?: string | null) {
  const shuffled = [...ids];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  if (avoidFirstId && shuffled.length > 1 && shuffled[0] === avoidFirstId) {
    const swapIndex = shuffled.findIndex((id) => id !== avoidFirstId);
    if (swapIndex > 0) {
      [shuffled[0], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[0]];
    }
  }
  return shuffled;
}

export default function DiscoverPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const initialFilters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const [filters, setFilters] = useState<DiscoverFiltersState>(initialFilters);
  const [activeIndex, setActiveIndex] = useState(0);
  const [cycleOrder, setCycleOrder] = useState<string[]>([]);
  const [cycleIndex, setCycleIndex] = useState(0);
  const [lastSwipedId, setLastSwipedId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    const params = buildFilterSearch(filters);
    const nextUrl = params ? `/discover?${params}` : "/discover";
    if (params !== searchParams.toString()) {
      router.replace(nextUrl);
    }
  }, [filters, router, searchParams]);

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    setActiveIndex(0);
    setCycleOrder([]);
    setCycleIndex(0);
    setLastSwipedId(null);
  }, [filtersKey]);

  const discoverQuery = useDiscoverFeed(filters);
  const feedItems = useMemo(
    () => discoverQuery.data?.pages.flatMap((page) => page.items ?? []) ?? [],
    [discoverQuery.data]
  );
  const profileMap = useMemo(() => new Map(feedItems.map((profile) => [profile.userId, profile])), [feedItems]);
  const hasNextPage = Boolean(discoverQuery.hasNextPage);
  const shouldCycle = !hasNextPage && feedItems.length > 0;

  useEffect(() => {
    if (!hasNextPage) return;
    if (discoverQuery.isFetchingNextPage) return;
    if (feedItems.length - activeIndex < 6) {
      void discoverQuery.fetchNextPage();
    }
  }, [activeIndex, feedItems.length, hasNextPage, discoverQuery]);

  useEffect(() => {
    if (!shouldCycle) return;
    if (activeIndex < feedItems.length) return;
    if (cycleOrder.length) return;
    setCycleOrder(shuffleIds(feedItems.map((profile) => profile.userId), lastSwipedId));
    setCycleIndex(0);
  }, [shouldCycle, feedItems, activeIndex, cycleOrder.length, lastSwipedId]);

  useEffect(() => {
    if (!shouldCycle) return;
    if (cycleIndex < cycleOrder.length) return;
    if (!cycleOrder.length) return;
    const nextOrder = shuffleIds(cycleOrder, lastSwipedId);
    setCycleOrder(nextOrder);
    setCycleIndex(0);
  }, [cycleIndex, cycleOrder, shouldCycle, lastSwipedId]);

  const activeProfile = useMemo(() => {
    if (activeIndex < feedItems.length) return feedItems[activeIndex];
    if (!shouldCycle || !cycleOrder.length) return undefined;
    const id = cycleOrder[cycleIndex];
    return id ? profileMap.get(id) : undefined;
  }, [activeIndex, feedItems, shouldCycle, cycleOrder, cycleIndex, profileMap]);

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

  function advanceQueue(swipedId: string) {
    setLastSwipedId(swipedId);
    if (activeIndex < feedItems.length - 1) {
      setActiveIndex((prev) => prev + 1);
      return;
    }
    if (activeIndex < feedItems.length) {
      setActiveIndex(feedItems.length);
      return;
    }
    if (cycleOrder.length) {
      setCycleIndex((prev) => prev + 1);
    }
  }

  function handleSwipe(action: "LIKE" | "PASS") {
    if (!activeProfile || isAnimating) return;
    setIsAnimating(true);
    setSwipeDirection(action === "LIKE" ? "right" : "left");
    likeMutation.mutate({ targetUserId: activeProfile.userId, action });
    window.setTimeout(() => {
      advanceQueue(activeProfile.userId);
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 320);
  }

  function getProfileAt(offset: number) {
    const index = activeIndex + offset;
    if (index < feedItems.length) return feedItems[index];
    if (!shouldCycle || !cycleOrder.length) return undefined;
    const cycleOffset = index - feedItems.length;
    const cyclePos = (cycleIndex + cycleOffset) % cycleOrder.length;
    const id = cycleOrder[cyclePos];
    return id ? profileMap.get(id) : undefined;
  }

  const stackProfiles = [0, 1, 2].map((offset) => ({
    profile: getProfileAt(offset),
    offset
  }));

  const isLoading = discoverQuery.isLoading;
  const isError = discoverQuery.isError;

  return (
    <RouteGuard requireActive>
      <AppShellLayout
        rightPanel={
          <Card>
            <h3>Filters</h3>
            <DiscoverFilters
              filters={filters}
              onChange={setFilters}
              onRefresh={() => void discoverQuery.refetch()}
              isRefreshing={discoverQuery.isFetching}
            />
          </Card>
        }
      >
        <div className="discover-page">
          <div className="discover-meta">
            <div>
              <h2>Discover</h2>
              <p className="text-muted">Swipe through curated introductions tailored to you.</p>
            </div>
            <div className="discover-count">{feedItems.length} profiles loaded</div>
          </div>
          <div className="discover-feed">
            {isLoading && !feedItems.length ? (
              <LoadingState message="Loading curated introductions..." />
            ) : isError ? (
              <ErrorState
                message={
                  discoverQuery.error instanceof Error
                    ? discoverQuery.error.message
                    : "Unable to load profiles."
                }
                onRetry={() => void discoverQuery.refetch()}
              />
            ) : activeProfile ? (
              <>
                <div className="discover-stack">
                  {stackProfiles.map(({ profile, offset }) => {
                    const isTop = offset === 0;
                    const depth = Math.min(offset, 2);
                    const placeholder = !profile && (discoverQuery.isFetchingNextPage || discoverQuery.isFetching);
                    if (!profile && !placeholder) return null;
                    return (
                      <DiscoverCard
                        key={profile?.userId ?? `placeholder-${offset}`}
                        profile={profile}
                        isActive={isTop}
                        isPlaceholder={placeholder}
                        isAnimating={isTop && isAnimating}
                        swipeDirection={isTop ? swipeDirection : null}
                        style={{
                          zIndex: 3 - offset,
                          transform: isTop ? undefined : `translateY(${depth * 14}px) scale(${1 - depth * 0.02})`,
                          pointerEvents: isTop ? "auto" : "none"
                        }}
                      />
                    );
                  })}
                </div>
                <div className="discover-actions">
                  <button
                    className="circle-action pass"
                    type="button"
                    onClick={() => handleSwipe("PASS")}
                    aria-label="Pass"
                    disabled={isAnimating || likeMutation.isPending}
                  >
                    ✕
                  </button>
                  <button
                    className="circle-action primary like"
                    type="button"
                    onClick={() => handleSwipe("LIKE")}
                    aria-label="Like"
                    disabled={isAnimating || likeMutation.isPending}
                  >
                    ❤
                  </button>
                </div>
              </>
            ) : (
              <EmptyState
                title="No more profiles"
                message="We’ll keep refreshing with new introductions."
                actionLabel="Refresh feed"
                onAction={() => void discoverQuery.refetch()}
              />
            )}
          </div>
        </div>
        <div className="discover-theme-toggle">
          <ThemeToggle variant="switch" label="Toggle dark mode" />
        </div>
      </AppShellLayout>
    </RouteGuard>
  );
}
