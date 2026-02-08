"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
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
import QuickProfileSheet from "./components/QuickProfileSheet";
import styles from "./discover.module.css";
import {
  type DiscoverFilters as DiscoverFiltersState,
  type DiscoverFeedResponse,
  type DiscoverProfile,
  useDiscoverFeed
} from "./useDiscoverFeed";

/* -------------------- DEFAULT FILTERS -------------------- */

const defaultFilters: DiscoverFiltersState = {
  intent: "dating",
  distance: 25
};

/* -------------------- HELPERS -------------------- */

function parseFilters(params: URLSearchParams): DiscoverFiltersState {
  const intent = params.get("intent");
  const distance = Number(params.get("distance"));

  return {
    intent: intent === "friends" || intent === "all" ? intent : "dating",
    distance: Number.isFinite(distance) && distance > 0 ? distance : defaultFilters.distance
  };
}

function buildFilterSearch(filters: DiscoverFiltersState) {
  const params = new URLSearchParams();
  if (filters.intent !== "dating") params.set("intent", filters.intent);
  if (filters.distance !== defaultFilters.distance) params.set("distance", String(filters.distance));
  return params.toString();
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
  const [isQuickProfileOpen, setIsQuickProfileOpen] = useState(false);
  const [quickProfile, setQuickProfile] = useState<DiscoverProfile | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const dragRafRef = useRef<number | null>(null);
  const dragStartRef = useRef<{ pointerId: number | null; x: number; y: number }>({
    pointerId: null,
    x: 0,
    y: 0
  });

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

  useEffect(
    () => () => {
      if (dragRafRef.current !== null) {
        cancelAnimationFrame(dragRafRef.current);
      }
    },
    []
  );

  /* ---------- FEED STATE ---------- */

  const discoverQuery = useDiscoverFeed(filters);

  const feedItems = useMemo(() => {
    const data = discoverQuery.data as InfiniteData<DiscoverFeedResponse> | undefined;
    return data?.pages.flatMap((p) => p.items ?? []) ?? [];
  }, [discoverQuery.data]);

  const [activeIndex, setActiveIndex] = useState(0);

  const hasNextPage = Boolean(discoverQuery.hasNextPage);

  useEffect(() => {
    setActiveIndex(0);
    setIsQuickProfileOpen(false);
    setQuickProfile(null);
    setDragOffset({ x: 0, y: 0 });
    dragOffsetRef.current = { x: 0, y: 0 };
    setIsDragging(false);
    setIsCardFlipped(false);
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (hasNextPage && feedItems.length - activeIndex < 6) {
      void discoverQuery.fetchNextPage();
    }
  }, [activeIndex, feedItems.length, hasNextPage, discoverQuery]);

  useEffect(() => {
    if (!hasNextPage && feedItems.length > 0 && activeIndex >= feedItems.length && !discoverQuery.isFetching) {
      queryClient.removeQueries({ queryKey: queryKeys.discoverFeed(filters) });
      setActiveIndex(0);
    }
  }, [activeIndex, discoverQuery.isFetching, feedItems.length, filters, hasNextPage, queryClient]);

  const activeProfile = useMemo(() => {
    if (activeIndex < feedItems.length) return feedItems[activeIndex];
    return undefined;
  }, [activeIndex, feedItems]);

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
  const isSwipeLocked = isAnimating || likeMutation.isPending || isQuickProfileOpen || isCardFlipped;

  function advance() {
    if (activeIndex < feedItems.length) setActiveIndex((i) => i + 1);
  }

  function handleSwipe(action: "LIKE" | "PASS") {
    if (!activeProfile || isSwipeLocked) return;
    setIsAnimating(true);
    setSwipeDirection(action === "LIKE" ? "right" : "left");
    setIsQuickProfileOpen(false);
    setDragOffset({ x: 0, y: 0 });
    dragOffsetRef.current = { x: 0, y: 0 };
    setIsDragging(false);
    setIsCardFlipped(false);

    likeMutation.mutate({ targetUserId: activeProfile.userId, action });

    setTimeout(() => {
      advance();
      setSwipeDirection(null);
      setIsAnimating(false);
    }, 320);
  }

  function openQuickProfile() {
    if (!activeProfile || isSwipeLocked) return;
    setQuickProfile(activeProfile);
    setIsQuickProfileOpen(true);
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    dragOffsetRef.current = { x: 0, y: 0 };
    setIsCardFlipped(false);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (!activeProfile || isSwipeLocked) return;
    dragStartRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    setIsDragging(true);
    dragOffsetRef.current = { x: 0, y: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (!isDragging || dragStartRef.current.pointerId !== event.pointerId) return;
    const dx = event.clientX - dragStartRef.current.x;
    const dy = event.clientY - dragStartRef.current.y;
    dragOffsetRef.current = { x: dx, y: dy };
    if (dragRafRef.current === null) {
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        setDragOffset(dragOffsetRef.current);
      });
    }
  }

  function handlePointerEnd(event: PointerEvent<HTMLElement>) {
    if (dragStartRef.current.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStartRef.current.pointerId = null;
    const { x, y } = dragOffsetRef.current;
    const threshold = 110;
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
    dragOffsetRef.current = { x: 0, y: 0 };
    if (Math.abs(x) >= threshold) {
      handleSwipe(x > 0 ? "LIKE" : "PASS");
      return;
    }
    if (Math.abs(x) < 6 && Math.abs(y) < 6) {
      openQuickProfile();
    }
  }

  const canInteract = Boolean(activeProfile && !isSwipeLocked);

  /* -------------------- RENDER -------------------- */

  return (
    <RouteGuard requireActive>
      <AppShellLayout showMobileShell={false}>
        <div className={styles.page}>
          <header className={styles.mobileHeader}>
            <div className={styles.mobileHeaderLeft}>
              <span className={styles.mobileLogo}>ELITE MATCH</span>
            </div>
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
                </div>
              ) : discoverQuery.isError ? (
                <ErrorState
                  message="Unable to load profiles"
                  onRetry={() => discoverQuery.refetch()}
                />
              ) : activeProfile ? (
                <>
                  <div className={styles.feedStack}>
                    <DiscoverCard
                      key={activeProfile.userId}
                      profile={activeProfile}
                      isActive
                      isAnimating={isAnimating}
                      swipeDirection={swipeDirection}
                      isDragging={isDragging}
                      isInteractionDisabled={!canInteract}
                      isFlipped={isCardFlipped}
                      onPass={() => {
                        handleSwipe("PASS");
                      }}
                      onLike={() => {
                        handleSwipe("LIKE");
                      }}
                      onInfo={() => setIsCardFlipped(true)}
                      onFlipBack={() => setIsCardFlipped(false)}
                      onPointerDown={canInteract ? handlePointerDown : undefined}
                      onPointerMove={canInteract ? handlePointerMove : undefined}
                      onPointerUp={canInteract ? handlePointerEnd : undefined}
                      onPointerCancel={canInteract ? handlePointerEnd : undefined}
                      style={
                        {
                          "--drag-x": `${dragOffset.x}px`,
                          "--drag-y": `${dragOffset.y}px`,
                          "--drag-rotate": `${dragOffset.x / 12}deg`
                        } as CSSProperties
                      }
                    />
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
                      disabled={!canInteract}
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
                      disabled={!canInteract}
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
        <QuickProfileSheet
          isOpen={isQuickProfileOpen}
          profile={quickProfile}
          onClose={() => setIsQuickProfileOpen(false)}
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
