"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { CSSProperties } from "react";
import { Tabs } from "@/app/components/ui/Tabs";
import { BottomSheet } from "@/app/components/ui/BottomSheet";
import { Chip, Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { Button } from "@/app/components/ui/Button";
import { useTheme, useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { useDiscoverBuffer } from "./useDiscoverBuffer";

const ALL_INTERESTS = ["Travel", "Fitness", "Music", "Cooking", "Reading", "Photography", "Movies", "Art", "Hiking", "Gaming", "Yoga", "Dancing"];
const PREFETCH_CARD_COUNT = 2;
const SWIPE_DISTANCE_THRESHOLD = 118;
const SWIPE_VELOCITY_THRESHOLD = 0.58;
const ROTATION_FACTOR = 0.042;

function toDiscoverImageUrl(url: string | null | undefined) {
  if (!url) return "/placeholder.svg";
  if (url.includes("/storage/v1/object/public/")) {
    return url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/").concat(url.includes("?") ? "&width=900&quality=75" : "?width=900&quality=75");
  }
  return url;
}

export default function DiscoverPage() {
  const { addToast } = useToast();
  const { theme, toggle } = useTheme();
  const [intent, setIntent] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [distance, setDistance] = useState(50);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [swipeXState, setSwipeXState] = useState(0);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [renderCount, setRenderCount] = useState(0);

  const intentInitializedRef = useRef(false);
  const intentManuallyChangedRef = useRef(false);
  const committedActionIdsRef = useRef(new Set<string>());
  const pointerActiveRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0, t: 0 });
  const swipeRef = useRef({ x: 0, y: 0, velocityX: 0, lastX: 0, lastT: 0 });
  const actionStartRef = useRef(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const nextCardRef = useRef<HTMLDivElement>(null);

  const {
    buffer,
    currentCard: currentProfile,
    loading,
    error,
    syncWarning,
    authRequired,
    advance,
    reload,
    lowWatermark,
    batchSize,
  } = useDiscoverBuffer({ intent, distance, selectedInterests });

  const showDiscoverDebugStatus = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEBUG_DISCOVER_STATUS === "true";
  const showDiscoverPerfLogs = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEBUG_DISCOVER_PERF === "true";

  useEffect(() => {
    if (!showDiscoverPerfLogs) return;
    setRenderCount((prev) => prev + 1);
  }, [showDiscoverPerfLogs, currentProfile?.userId, loading, error]);

  const applyCardTransform = useCallback((x: number, y: number, rotateDeg?: number) => {
    const card = cardRef.current;
    const nextCard = nextCardRef.current;
    if (!card) return;

    const progress = Math.min(Math.abs(x) / SWIPE_DISTANCE_THRESHOLD, 1.1);
    const rotation = rotateDeg ?? x * ROTATION_FACTOR;
    card.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg)`;
    card.style.setProperty("--swipe-progress", String(progress));

    if (nextCard) {
      const nextScale = 0.95 + Math.min(progress, 1) * 0.05;
      const nextLift = 20 - Math.min(progress, 1) * 20;
      nextCard.style.transform = `translate3d(0, ${nextLift}px, 0) scale(${nextScale})`;
      nextCard.style.opacity = String(0.62 + Math.min(progress, 1) * 0.38);
    }
  }, []);

  const resetCardTransform = useCallback(() => {
    swipeRef.current = { x: 0, y: 0, velocityX: 0, lastX: 0, lastT: 0 };
    applyCardTransform(0, 0, 0);
    setSwipeXState(0);
  }, [applyCardTransform]);

  useEffect(() => {
    if (intentInitializedRef.current) return;

    const setInitialIntentTab = async () => {
      try {
        const data = await apiFetch<any>("/profile");
        const profileIntent = String(data?.profile?.intent ?? "").toLowerCase();
        if (intentManuallyChangedRef.current) return;
        if (profileIntent === "dating") setIntent("dating");
        else if (profileIntent === "friends") setIntent("friends");
        else setIntent("all");
      } catch {
        setIntent("all");
      } finally {
        intentInitializedRef.current = true;
      }
    };

    void setInitialIntentTab();
  }, []);

  const handleAction = useCallback(
    (type: "LIKE" | "PASS", direction?: "left" | "right") => {
      if (!currentProfile || animatingOut) return;

      const actionId = `${currentProfile.userId}:${type}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
      if (committedActionIdsRef.current.has(actionId)) return;
      committedActionIdsRef.current.add(actionId);

      const resolvedDirection = direction || (type === "PASS" ? "left" : "right");
      const endX = resolvedDirection === "left" ? -window.innerWidth * 1.25 : window.innerWidth * 1.25;
      const endY = swipeRef.current.y;
      const endRotation = resolvedDirection === "left" ? -16 : 16;

      setAnimatingOut(true);
      setSwipeDirection(resolvedDirection);
      setSwipeXState(endX);
      actionStartRef.current = performance.now();

      const card = cardRef.current;
      if (card) {
        card.style.transition = "transform 280ms cubic-bezier(0.24, 0.9, 0.2, 1), opacity 240ms ease-out";
      }
      applyCardTransform(endX, endY, endRotation);
      advance({ actionId, type });

      if (type === "PASS") addToast("Passed", "info");

      window.setTimeout(() => {
        if (showDiscoverPerfLogs) {
          // eslint-disable-next-line no-console
          console.debug("discover.action.latency", {
            type,
            elapsedMs: Math.round(performance.now() - actionStartRef.current),
          });
        }
        const activeCard = cardRef.current;
        if (activeCard) {
          activeCard.style.transition = "transform 220ms cubic-bezier(0.2, 0.82, 0.24, 1)";
        }
        resetCardTransform();
        setSwipeDirection(null);
        setAnimatingOut(false);
      }, 295);
    },
    [currentProfile, animatingOut, applyCardTransform, advance, addToast, resetCardTransform, showDiscoverPerfLogs]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (animatingOut) return;
    pointerActiveRef.current = true;
    startPosRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    swipeRef.current.lastX = e.clientX;
    swipeRef.current.lastT = performance.now();

    const card = cardRef.current;
    if (card) {
      card.style.transition = "none";
      card.style.cursor = "grabbing";
    }
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [animatingOut]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!pointerActiveRef.current) return;

    const now = performance.now();
    const dx = e.clientX - startPosRef.current.x;
    const dy = (e.clientY - startPosRef.current.y) * 0.28;
    const dt = Math.max(now - swipeRef.current.lastT, 1);
    const velocityX = (e.clientX - swipeRef.current.lastX) / dt;

    swipeRef.current = { x: dx, y: dy, velocityX, lastX: e.clientX, lastT: now };
    applyCardTransform(dx, dy);
    setSwipeXState(dx);
  }, [applyCardTransform]);

  const handlePointerUp = useCallback(() => {
    if (!pointerActiveRef.current) return;
    pointerActiveRef.current = false;

    const { x, y, velocityX } = swipeRef.current;
    const absX = Math.abs(x);
    const shouldDismiss = absX > SWIPE_DISTANCE_THRESHOLD || Math.abs(velocityX) > SWIPE_VELOCITY_THRESHOLD;

    if (shouldDismiss) {
      handleAction(velocityX < 0 || x < 0 ? "PASS" : "LIKE", x < 0 ? "left" : "right");
      return;
    }

    const card = cardRef.current;
    if (card) {
      card.style.transition = "transform 340ms cubic-bezier(0.18, 0.9, 0.22, 1)";
      card.style.cursor = "grab";
    }

    applyCardTransform(0, 0, 0);
    swipeRef.current = { x: 0, y: 0, velocityX: 0, lastX: 0, lastT: 0 };
    setSwipeXState(0);
  }, [applyCardTransform, handleAction]);

  const [photoLoaded, setPhotoLoaded] = useState(false);
  const prefetchCacheRef = useRef(new Set<string>());
  const currentPhotoSrc = toDiscoverImageUrl(currentProfile?.photo);
  const nextProfile = buffer[1] ?? null;

  useEffect(() => {
    setPhotoLoaded(false);
  }, [currentPhotoSrc]);

  useEffect(() => {
    const nextPhotos = buffer
      .slice(1, PREFETCH_CARD_COUNT + 1)
      .map((card) => toDiscoverImageUrl(card.photo))
      .filter((url) => url !== "/placeholder.svg" && !prefetchCacheRef.current.has(url));

    for (const url of nextPhotos) {
      const img = new window.Image();
      img.decoding = "async";
      img.src = url;
      prefetchCacheRef.current.add(url);
    }
  }, [buffer]);

  useEffect(() => {
    if (!authRequired) return;
    addToast("Session expired. Please sign in again to sync likes.", "error");
  }, [authRequired, addToast]);

  const actionBtnStyle = useMemo(() => (bg: string, size = 56): CSSProperties => ({
    width: size,
    height: size,
    borderRadius: "50%",
    background: bg,
    border: "1px solid color-mix(in srgb, var(--border) 72%, var(--accent) 28%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.4,
    color: "var(--ctaText)",
    boxShadow: "var(--shadow-md)",
    cursor: "pointer",
    transition: "transform 180ms cubic-bezier(0.22, 0.9, 0.2, 1), box-shadow 180ms ease-out, background-color 180ms ease-out",
    willChange: "transform",
  }), []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "calc(100dvh - var(--app-header-offset))",
      overflowX: "hidden",
      padding: "10px 0 0",
      paddingBottom: "calc(var(--app-bottom-nav-height) + var(--sab) + 24px)",
    }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4px 0 10px", position: "relative" }}>
        {loading ? (
          <div style={{ width: "min(100%, 430px)", height: "clamp(520px, 70vh, 640px)", borderRadius: 30, overflow: "hidden" }}>
            <Skeleton width="100%" height="100%" radius={30} />
          </div>
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : !currentProfile ? (
          <EmptyState
            title="No more profiles"
            description="Adjust your filters or check back later for new people."
            action={{ label: "Adjust Filters", onClick: () => setFilterOpen(true) }}
          />
        ) : (
          <>
            {nextProfile && (
              <div
                ref={nextCardRef}
                aria-hidden
                style={{
                  width: "min(100%, 430px)",
                  height: "clamp(520px, 70vh, 640px)",
                  borderRadius: 30,
                  background: "color-mix(in srgb, var(--surface2) 72%, var(--surface))",
                  position: "absolute",
                  transform: "translate3d(0, 20px, 0) scale(0.95)",
                  opacity: 0.62,
                  boxShadow: "var(--shadow-sm)",
                  border: "1px solid color-mix(in srgb, var(--border) 76%, var(--accent) 24%)",
                  overflow: "hidden",
                }}
              >
                <img src={toDiscoverImageUrl(nextProfile.photo)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "saturate(0.94) brightness(0.88)" }} loading="lazy" decoding="async" />
              </div>
            )}

            <div
              ref={cardRef}
              style={{
                width: "min(100%, 430px)",
                height: "clamp(520px, 70vh, 640px)",
                borderRadius: 30,
                overflow: "hidden",
                boxShadow: "var(--shadow-md)",
                position: "relative",
                margin: "0 auto",
                touchAction: "none",
                userSelect: "none",
                transform: "translate3d(0,0,0)",
                cursor: "grab",
                willChange: "transform",
                border: "1px solid color-mix(in srgb, var(--border) 72%, var(--accent) 28%)",
              }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {!photoLoaded && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, color-mix(in srgb, var(--surface2) 92%, transparent), color-mix(in srgb, var(--surface) 80%, transparent), color-mix(in srgb, var(--surface2) 92%, transparent))" }} />}
              <img
                src={currentPhotoSrc}
                alt={currentProfile.name}
                style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, opacity: photoLoaded ? 1 : 0, transition: "opacity 180ms ease-out" }}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onLoad={() => setPhotoLoaded(true)}
                crossOrigin="anonymous"
                draggable={false}
              />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, color-mix(in srgb, var(--bg) 8%, transparent) 0%, transparent 35%, color-mix(in srgb, var(--bg) 42%, transparent) 100%)", pointerEvents: "none" }} />

              {swipeXState > 24 && <div style={{ position: "absolute", top: 40, left: 24, padding: "8px 16px", border: "2px solid var(--accent)", color: "var(--accent)", borderRadius: "var(--radius-md)", fontWeight: 800, fontSize: 28, transform: "rotate(-16deg)", opacity: Math.min(swipeXState / 100, 1), background: "color-mix(in srgb, var(--surface) 88%, transparent)" }}>LIKE</div>}
              {swipeXState < -24 && <div style={{ position: "absolute", top: 40, right: 24, padding: "8px 16px", border: "2px solid var(--text-secondary)", color: "var(--text-secondary)", borderRadius: "var(--radius-md)", fontWeight: 800, fontSize: 28, transform: "rotate(16deg)", opacity: Math.min(Math.abs(swipeXState) / 100, 1), background: "color-mix(in srgb, var(--surface) 88%, transparent)" }}>PASS</div>}

              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(transparent 20%, color-mix(in srgb, var(--bg) 88%, transparent))", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 24px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <h2 style={{ color: "var(--ctaText)", margin: 0, fontSize: 26 }}>{currentProfile.name}, {currentProfile.age}</h2>
                  {currentProfile.verified && <Badge variant="success" style={{ fontSize: 11 }}>Verified</Badge>}
                  {currentProfile.premium && <Badge variant="primary" style={{ fontSize: 11 }}>Premium</Badge>}
                </div>
                <p style={{ color: "color-mix(in srgb, var(--ctaText) 80%, transparent)", fontSize: 14, marginBottom: 4 }}>{currentProfile.city}</p>
                <p style={{ color: "color-mix(in srgb, var(--ctaText) 70%, transparent)", fontSize: 14, margin: 0 }}>{currentProfile.bio}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {!loading && currentProfile && (
        <div className="discover-swipe-actions" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 18, padding: "14px 0 6px" }}>
          <button onClick={() => addToast("Rewind is unavailable in buffered mode", "info")} style={actionBtnStyle("var(--surface2)", 54)} aria-label="Rewind" className="discover-action-button discover-action-button--neutral">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
          </button>
          <button onClick={() => handleAction("PASS", "left")} style={actionBtnStyle("color-mix(in srgb, var(--surface2) 90%, var(--rose-glow))", 54)} aria-label="Pass" className="discover-action-button discover-action-button--pass">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
          <button onClick={() => handleAction("LIKE", "right")} style={actionBtnStyle("var(--accent)", 56)} aria-label="Like" className="discover-action-button discover-action-button--like">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--ctaText)" stroke="var(--ctaText)" strokeWidth="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
          </button>
        </div>
      )}

      <BottomSheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters">
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: 12 }}>Looking for</label>
            <Tabs tabs={[{ label: "All", value: "all" }, { label: "Dating", value: "dating" }, { label: "Friends", value: "friends" }]} active={intent} onChange={(next) => { intentManuallyChangedRef.current = true; setIntent(next); }} />
          </div>
          <div>
            <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: 12 }}>Distance: {distance} km</label>
            <input type="range" min={5} max={200} value={distance} onChange={(e) => setDistance(Number(e.target.value))} style={{ width: "100%", accentColor: "var(--primary)" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginTop: 4 }}><span>5 km</span><span>200 km</span></div>
          </div>
          <div>
            <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: 12 }}>Interests</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ALL_INTERESTS.map((interest) => (
                <Chip key={interest} label={interest} selected={selectedInterests.includes(interest)} onClick={() => setSelectedInterests((prev) => (prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]))} />
              ))}
            </div>
          </div>
          <Button fullWidth onClick={() => { setFilterOpen(false); reload(); }}>Apply Filters</Button>
          <button onClick={toggle} style={{ border: "1px solid var(--border)", background: "var(--surface2)", borderRadius: "var(--radius-md)", padding: "12px 14px", textAlign: "left", fontWeight: 600 }}>Theme: {theme === "light" ? "Light" : "Dark"}</button>
        </div>
      </BottomSheet>

      {showDiscoverDebugStatus && syncWarning && <div style={{ textAlign: "center", padding: "4px 12px", fontSize: 12, color: "var(--muted)" }}>Syncing swipes in background...</div>}
      {showDiscoverDebugStatus && <div style={{ textAlign: "center", paddingBottom: 8, fontSize: 11, color: "var(--muted)" }}>Buffered discover enabled ({batchSize} batch / refill below {lowWatermark})</div>}
      {showDiscoverPerfLogs && <div style={{ textAlign: "center", paddingBottom: 8, fontSize: 11, color: "var(--muted)" }}>QA mode • renders: {renderCount} • swipeDirection: {swipeDirection ?? "idle"}</div>}
      <DiscoverFilterBridge onOpen={() => setFilterOpen(true)} />
    </div>
  );
}

function DiscoverFilterBridge({ onOpen }: { onOpen: () => void }) {
  useEffect(() => {
    const handler = () => onOpen();
    window.addEventListener("elite-open-discover-filters", handler);
    return () => window.removeEventListener("elite-open-discover-filters", handler);
  }, [onOpen]);

  return null;
}
