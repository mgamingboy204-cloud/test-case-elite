"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { apiFetch } from "../../lib/api";
import { queryKeys } from "../../lib/queryKeys";

import RouteGuard from "../components/RouteGuard";
import AppShellLayout from "../components/ui/AppShellLayout";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";

import DiscoverCard from "./components/DiscoverCard";
import DiscoverFilters from "./components/DiscoverFilters";
import styles from "./discover.module.css";
import {
  type DiscoverFilters as DiscoverFiltersState,
  type DiscoverFeedResponse,
  useDiscoverFeed
} from "./useDiscoverFeed";

/* -------------------- DEFAULT FILTERS -------------------- */

const defaultFilters: DiscoverFiltersState = {
  intent: "dating",
  ageMin: 24,
  ageMax: 38,
  distance: 25
};

/* -------------------- HELPERS -------------------- */

function parseFilters(params: URLSearchParams): DiscoverFiltersState {
  const intent = params.get("intent");
  const ageMin = Number(params.get("ageMin"));
  const ageMax = Number(params.get("ageMax"));
  const distance = Number(params.get("distance"));

  return {
    intent: intent === "friends" || intent === "all" ? intent : "dating",
    ageMin: Number.isFinite(ageMin) && ageMin >= 18 ? ageMin : defaultFilters.ageMin,
    ageMax: Number.isFinite(ageMax) && ageMax >= 18 ? ageMax : defaultFilters.ageMax,
    distance: Number.isFinite(distance) && distance > 0 ? distance : defaultFilters.distance
  };
}

function buildFilterSearch(filters: DiscoverFiltersState) {
  const params = new URLSearchParams();
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
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(initialFilters);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  useEffect(() => {
    const qs = buildFilterSearch(filters);
    router.replace(qs ? `/discover?${qs}` : "/discover");
  }, [filters, router]);

  useEffect(() => {
    if (isFilterSheetOpen) {
      setDraftFilters(filters);
    }
  }, [filters, isFilterSheetOpen]);

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
    setIsDetailsOpen(false);
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
    setIsDetailsOpen(false);

    likeMutation.mutate({ targetUserId: activeProfile.userId, action });

    setTimeout(() => {
      advance(activeProfile.userId);
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 320);
  }

  function toggleDetails() {
    setIsDetailsOpen((prev) => !prev);
  }

  /* -------------------- RENDER -------------------- */

  return (
    <RouteGuard requireActive>
      <AppShellLayout showMobileShell={false}>
        <div className={styles.page}>
          <header className={styles.mobileHeader}>
            <button
              type="button"
              className={styles.mobileIconButton}
              aria-label="Filters"
              onClick={() => setIsFilterSheetOpen(true)}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M4 6.5a1 1 0 0 1 1-1h14a1 1 0 1 1 0 2H5a1 1 0 0 1-1-1Zm3 5a1 1 0 0 1 1-1h8a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Zm3 5a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2h-2a1 1 0 0 1-1-1Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <span className={styles.mobileTitle}>Discover</span>
            <Link href="/settings" className={styles.mobileIconButton} aria-label="Settings">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm8.1 3.2c0-.4-.1-.8-.2-1.2l2-1.6-2-3.4-2.4.9a7.6 7.6 0 0 0-2.1-1.2L13 1h-4l-.4 3.9c-.7.3-1.4.7-2.1 1.2l-2.4-.9-2 3.4 2 1.6c-.1.4-.2.8-.2 1.2s.1.8.2 1.2l-2 1.6 2 3.4 2.4-.9c.7.5 1.3.9 2.1 1.2L9 23h4l.4-3.9c.7-.3 1.4-.7 2.1-1.2l2.4.9 2-3.4-2-1.6c.1-.4.2-.8.2-1.2Z"
                  fill="currentColor"
                />
              </svg>
            </Link>
          </header>

          <section className={styles.feedColumn}>
            <div className={styles.feedStage}>
              {discoverQuery.isLoading && !feedItems.length ? (
                <div className={styles.feedStack} aria-hidden="true">
                  <DiscoverCard isPlaceholder />
                  <DiscoverCard
                    isPlaceholder
                    style={
                      {
                        "--stack-offset": "12px",
                        "--stack-scale": "0.98",
                        "--stack-rotate-mobile": "-4deg"
                      } as CSSProperties
                    }
                  />
                </div>
              ) : discoverQuery.isError ? (
                <ErrorState
                  message="Unable to load profiles"
                  onRetry={() => discoverQuery.refetch()}
                />
              ) : activeProfile ? (
                <>
                  <div className={styles.feedStack}>
                    {[activeProfile, feedItems[activeIndex + 1], feedItems[activeIndex + 2]].map(
                      (profile, index) => {
                        if (!profile) return null;
                        const offset = index * 10;
                        const scale = 1 - index * 0.03;
                        const stackStyle = index
                          ? ({
                              "--stack-offset": `${offset}px`,
                              "--stack-scale": `${scale}`,
                              "--stack-rotate-mobile": index === 1 ? "-6deg" : "4deg"
                            } as CSSProperties)
                          : undefined;
                        return (
                          <DiscoverCard
                            key={`${profile.userId}-${index}`}
                            profile={profile}
                            isActive={index === 0}
                            isAnimating={index === 0 ? isAnimating : false}
                            swipeDirection={index === 0 ? swipeDirection : null}
                            isExpanded={index === 0 ? isDetailsOpen : false}
                            onToggleExpanded={index === 0 ? toggleDetails : undefined}
                            style={stackStyle}
                          />
                        );
                      }
                    )}
                  </div>
                  <div className={styles.actions}>
                    <button
                      className={`${styles.actionButton} ${styles.actionButtonPass}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSwipe("PASS");
                      }}
                      aria-label="Pass"
                      type="button"
                    >
                      ✕
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.actionButtonLike}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSwipe("LIKE");
                      }}
                      aria-label="Like"
                      type="button"
                    >
                      ❤
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.emptyState}>
                  <EmptyState title="No profiles" message="Check back later." />
                </div>
              )}
            </div>
            {discoverQuery.isFetching && feedItems.length ? (
              <LoadingState message="Loading more…" />
            ) : null}
          </section>

          <aside className={styles.filtersColumn}>
            <Card className={styles.filtersCard}>
              <div className={styles.filtersHeader}>
                <h3>Filters</h3>
              </div>
              <DiscoverFilters
                filters={filters}
                onChange={setFilters}
                onRefresh={() => discoverQuery.refetch()}
                isRefreshing={discoverQuery.isFetching}
                showRefresh
              />
            </Card>
          </aside>
        </div>
        <DiscoverFilters
          variant="sheet"
          filters={draftFilters}
          onChange={setDraftFilters}
          isOpen={isFilterSheetOpen}
          onClose={() => setIsFilterSheetOpen(false)}
          onApply={() => {
            setFilters(draftFilters);
            setIsFilterSheetOpen(false);
          }}
          onReset={() => setDraftFilters(defaultFilters)}
          onRefresh={() => discoverQuery.refetch()}
          isRefreshing={discoverQuery.isFetching}
          showRefresh
        />
        <nav className={styles.mobileBottomNav} aria-label="Discover navigation">
          <Link href="/likes" className={styles.mobileNavItem}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 20.3c-4.3-3-7.6-6.2-7.6-10.1A4.4 4.4 0 0 1 8.9 5c1.4 0 2.7.6 3.1 1.7C12.4 5.6 13.7 5 15.1 5a4.4 4.4 0 0 1 4.5 5.2c0 3.9-3.3 7-7.6 10.1Z"
                fill="currentColor"
              />
            </svg>
            <span>Likes</span>
          </Link>
          <span className={`${styles.mobileNavItem} ${styles.mobileBottomNavActive}`} aria-current="page">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 2a10 10 0 1 0 10 10h-2.4a7.6 7.6 0 1 1-2.2-5.4l-3 3H22V2l-2.5 2.5A9.9 9.9 0 0 0 12 2Z"
                fill="currentColor"
              />
            </svg>
            <span>Discover</span>
          </span>
          <Link href="/matches" className={styles.mobileNavItem}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7 6.5a4.5 4.5 0 1 0 4.5 4.5A4.5 4.5 0 0 0 7 6.5Zm10 0a4 4 0 1 0 4 4 4 4 0 0 0-4-4ZM7 13a7 7 0 0 0-7 6.5c0 .8.7 1.5 1.6 1.5h10.8c.9 0 1.6-.7 1.6-1.5A7 7 0 0 0 7 13Zm10 0a6.2 6.2 0 0 0-4.2 1.6 8.6 8.6 0 0 1 2.2 5.4h6.4c.9 0 1.6-.7 1.6-1.5A6.2 6.2 0 0 0 17 13Z"
                fill="currentColor"
              />
            </svg>
            <span>Matches</span>
          </Link>
          <Link href="/profile" className={styles.mobileNavItem}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 12.2a4.3 4.3 0 1 0-4.3-4.3 4.3 4.3 0 0 0 4.3 4.3Zm0 2c-3.8 0-7 2.1-7 4.6 0 1 .8 1.7 1.9 1.7h10.2c1 0 1.9-.7 1.9-1.7 0-2.5-3.2-4.6-7-4.6Z"
                fill="currentColor"
              />
            </svg>
            <span>Profile</span>
          </Link>
        </nav>
      </AppShellLayout>
    </RouteGuard>
  );
}
