"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Tabs } from "@/app/components/ui/Tabs";
import { BottomSheet } from "@/app/components/ui/BottomSheet";
import { Chip, Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { Button } from "@/app/components/ui/Button";
import { useTheme, useToast } from "@/app/providers";
import type { CSSProperties } from "react";
import { apiFetch } from "@/lib/api";
import { useDiscoverBuffer } from "./useDiscoverBuffer";

const ALL_INTERESTS = ["Travel", "Fitness", "Music", "Cooking", "Reading", "Photography", "Movies", "Art", "Hiking", "Gaming", "Yoga", "Dancing"];
const PREFETCH_CARD_COUNT = 2;
const SWIPE_DISTANCE_THRESHOLD = 112;
const SWIPE_VELOCITY_THRESHOLD = 0.42;

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
  const [animatingOut, setAnimatingOut] = useState(false);
  const [buttonPulse, setButtonPulse] = useState<"like" | "pass" | null>(null);

  const intentInitializedRef = useRef(false);
  const intentManuallyChangedRef = useRef(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const lastDeltaRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ x: 0, lastT: 0 });
  const swipingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const committedActionIdsRef = useRef(new Set<string>());
  const renderCountRef = useRef(0);

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
    queueDepth,
  } = useDiscoverBuffer({
    intent,
    distance,
    selectedInterests,
    onQueueEvent: (event) => {
      if (event.type === "retrying") addToast("Sync issue detected. We’ll retry your swipe.", "info");
      if (event.type === "dropped") addToast("We couldn't sync one swipe yet. We'll keep retrying quietly.", "error");
    },
  });

  useEffect(() => {
    renderCountRef.current += 1;
    if (process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEBUG_DISCOVER_PERF === "true") {
      // eslint-disable-next-line no-console
      console.debug("discover.render", { count: renderCountRef.current, buffer: buffer.length, queueDepth });
    }
  });

  const updateCardMotion = useCallback((x: number, y: number) => {
    const node = cardRef.current;
    if (!node) return;
    const likeProgress = Math.min(Math.max(x / SWIPE_DISTANCE_THRESHOLD, 0), 1);
    const passProgress = Math.min(Math.max(-x / SWIPE_DISTANCE_THRESHOLD, 0), 1);
    node.style.setProperty("--swipe-x", `${x}px`);
    node.style.setProperty("--swipe-y", `${y}px`);
    node.style.setProperty("--swipe-rot", `${x * 0.06}deg`);
    node.style.setProperty("--like-progress", likeProgress.toFixed(3));
    node.style.setProperty("--pass-progress", passProgress.toFixed(3));
  }, []);

  const scheduleMotionUpdate = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      updateCardMotion(lastDeltaRef.current.x, lastDeltaRef.current.y);
    });
  }, [updateCardMotion]);

  useEffect(() => {
    if (intentInitializedRef.current) return;
    const setInitialIntentTab = async () => {
      try {
        const data = await apiFetch<any>("/profile");
        const profileIntent = String(data?.profile?.intent ?? "").toLowerCase();
        if (intentManuallyChangedRef.current) return;
        setIntent(profileIntent === "dating" || profileIntent === "friends" ? profileIntent : "all");
      } catch {
        setIntent("all");
      } finally {
        intentInitializedRef.current = true;
      }
    };
    void setInitialIntentTab();
  }, []);

  const resetCardMotion = useCallback((withTransition: boolean) => {
    const node = cardRef.current;
    if (!node) return;
    node.style.transition = withTransition ? "transform 260ms cubic-bezier(0.2, 0.9, 0.24, 1)" : "none";
    lastDeltaRef.current = { x: 0, y: 0 };
    updateCardMotion(0, 0);
  }, [updateCardMotion]);

  const handleAction = useCallback((type: "LIKE" | "PASS", direction?: "left" | "right") => {
    if (!currentProfile || animatingOut) return;
    const actionId = `${currentProfile.userId}:${type}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
    if (committedActionIdsRef.current.has(actionId)) return;
    committedActionIdsRef.current.add(actionId);

    const resolvedDirection = direction || (type === "PASS" ? "left" : "right");
    setAnimatingOut(true);
    const outX = resolvedDirection === "left" ? -560 : 560;
    const outY = lastDeltaRef.current.y * 0.8;

    const node = cardRef.current;
    if (node) node.style.transition = "transform 220ms cubic-bezier(0.15, 0.85, 0.25, 1), opacity 180ms ease";
    lastDeltaRef.current = { x: outX, y: outY };
    updateCardMotion(outX, outY);
    advance({ actionId, type });

    if (type === "PASS") addToast("Passed", "info");

    window.setTimeout(() => {
      setAnimatingOut(false);
      resetCardMotion(false);
    }, 230);
  }, [currentProfile, animatingOut, addToast, advance, updateCardMotion, resetCardMotion]);

  const pulseButton = (mode: "like" | "pass") => {
    setButtonPulse(mode);
    window.setTimeout(() => setButtonPulse((prev) => (prev === mode ? null : prev)), 140);
  };

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (animatingOut) return;
    swipingRef.current = true;
    startPos.current = { x: e.clientX, y: e.clientY };
    velocityRef.current = { x: 0, lastT: performance.now() };
    if (cardRef.current) cardRef.current.style.transition = "none";
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [animatingOut]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!swipingRef.current) return;
    const now = performance.now();
    const dx = e.clientX - startPos.current.x;
    const dy = (e.clientY - startPos.current.y) * 0.28;
    const elapsed = Math.max(1, now - velocityRef.current.lastT);
    velocityRef.current.x = (dx - lastDeltaRef.current.x) / elapsed;
    velocityRef.current.lastT = now;
    lastDeltaRef.current = { x: dx, y: dy };
    scheduleMotionUpdate();
  }, [scheduleMotionUpdate]);

  const handlePointerUp = useCallback(() => {
    if (!swipingRef.current) return;
    swipingRef.current = false;
    const absX = Math.abs(lastDeltaRef.current.x);
    const releaseVelocity = Math.abs(velocityRef.current.x);
    const passesDistance = absX > SWIPE_DISTANCE_THRESHOLD;
    const passesVelocity = absX > 36 && releaseVelocity > SWIPE_VELOCITY_THRESHOLD;

    if ((passesDistance || passesVelocity) && lastDeltaRef.current.x > 0) return handleAction("LIKE", "right");
    if ((passesDistance || passesVelocity) && lastDeltaRef.current.x < 0) return handleAction("PASS", "left");
    resetCardMotion(true);
  }, [handleAction, resetCardMotion]);

  const [photoLoaded, setPhotoLoaded] = useState(false);
  const prefetchCacheRef = useRef(new Set<string>());
  const currentPhotoSrc = toDiscoverImageUrl(currentProfile?.photo);

  useEffect(() => setPhotoLoaded(false), [currentPhotoSrc]);

  useEffect(() => {
    const nextPhotos = buffer.slice(1, PREFETCH_CARD_COUNT + 1).map((card) => toDiscoverImageUrl(card.photo)).filter((url) => url !== "/placeholder.svg" && !prefetchCacheRef.current.has(url));
    for (const url of nextPhotos) {
      const img = new window.Image();
      img.decoding = "async";
      img.src = url;
      prefetchCacheRef.current.add(url);
    }
  }, [buffer]);

  useEffect(() => {
    if (authRequired) addToast("Session expired. Please sign in again to sync likes.", "error");
  }, [authRequired, addToast]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_DEBUG_DISCOVER_PERF !== "true") return;
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      frames += 1;
      if (now - last >= 1000) {
        const fps = Math.round((frames * 1000) / (now - last));
        if (fps < 50) console.warn("discover.fps.drop", { fps });
        else console.debug("discover.fps", { fps });
        frames = 0;
        last = now;
      }
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const showDiscoverDebugStatus = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEBUG_DISCOVER_STATUS === "true";

  const cardStyle: CSSProperties = useMemo(() => ({
    width: "min(100%, 430px)",
    height: "clamp(520px, 70vh, 640px)",
    borderRadius: 30,
    overflow: "hidden",
    boxShadow: "var(--shadow-md)",
    position: "relative",
    margin: "0 auto",
    touchAction: "none",
    userSelect: "none",
    transform: "translate3d(var(--swipe-x, 0px), var(--swipe-y, 0px), 0) rotate(var(--swipe-rot, 0deg))",
    transition: "transform 250ms cubic-bezier(0.32, 0.72, 0, 1)",
    cursor: animatingOut ? "grabbing" : "grab",
    willChange: "transform",
  }), [animatingOut]);

  const actionBtnStyle = (bg: string, size = 56, mode: "like" | "pass" | "rewind" = "rewind"): CSSProperties => {
    const progressVar = mode === "like" ? "var(--like-progress, 0)" : mode === "pass" ? "var(--pass-progress, 0)" : "0";
    const tapPulse = buttonPulse === mode ? 0.08 : 0;
    return {
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
      boxShadow: `0 10px 24px color-mix(in srgb, var(--accent) calc(${progressVar} * 24%), transparent)`,
      transform: `translateZ(0) scale(calc(1 + ${progressVar} * 0.08 + ${tapPulse})) rotate(calc(${mode === "pass" ? "-1" : "1"} * ${progressVar} * 5deg))`,
      transition: "transform 140ms ease, box-shadow 140ms ease",
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "calc(100dvh - var(--app-header-offset))", overflowX: "hidden", padding: "10px 0 0", paddingBottom: "calc(var(--app-bottom-nav-height) + var(--sab) + 24px)" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4px 0 10px", position: "relative" }}>
        {loading ? (
          <div style={{ width: "min(100%, 430px)", height: "clamp(520px, 70vh, 640px)", borderRadius: 30, overflow: "hidden" }}><Skeleton width="100%" height="100%" radius={30} /></div>
        ) : error ? <ErrorState onRetry={reload} /> : !currentProfile ? (
          <EmptyState title="No more profiles" description="Adjust your filters or check back later for new people." action={{ label: "Adjust Filters", onClick: () => setFilterOpen(true) }} icon={<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M16 16s-1.5-2-4-2-4 2-4 2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>} />
        ) : (
          <div ref={cardRef} style={cardStyle} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
            {!photoLoaded && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(120deg, color-mix(in srgb, var(--surface2) 92%, transparent), color-mix(in srgb, var(--surface) 80%, transparent), color-mix(in srgb, var(--surface2) 92%, transparent))" }} />}
            <img src={currentPhotoSrc} alt={currentProfile.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, opacity: photoLoaded ? 1 : 0, transition: "opacity 180ms ease-out" }} loading="eager" fetchPriority="high" decoding="async" onLoad={() => setPhotoLoaded(true)} crossOrigin="anonymous" draggable={false} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, color-mix(in srgb, var(--bg) 8%, transparent) 0%, transparent 35%, color-mix(in srgb, var(--bg) 42%, transparent) 100%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: 40, left: 24, padding: "8px 16px", border: "2px solid var(--accent)", color: "var(--accent)", borderRadius: "var(--radius-md)", fontWeight: 800, fontSize: 28, transform: "rotate(-20deg)", opacity: "var(--like-progress, 0)", background: "color-mix(in srgb, var(--surface) 88%, transparent)" }}>LIKE</div>
            <div style={{ position: "absolute", top: 40, right: 24, padding: "8px 16px", border: "2px solid var(--text-secondary)", color: "var(--text-secondary)", borderRadius: "var(--radius-md)", fontWeight: 800, fontSize: 28, transform: "rotate(20deg)", opacity: "var(--pass-progress, 0)", background: "color-mix(in srgb, var(--surface) 88%, transparent)" }}>NOPE</div>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(transparent 20%, color-mix(in srgb, var(--bg) 88%, transparent))", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 24px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}><h2 style={{ color: "var(--ctaText)", margin: 0, fontSize: 26 }}>{currentProfile.name}, {currentProfile.age}</h2>{currentProfile.verified && <Badge variant="success" style={{ fontSize: 11 }}>Verified</Badge>}{currentProfile.premium && <Badge variant="primary" style={{ fontSize: 11 }}>Premium</Badge>}</div>
              <p style={{ color: "color-mix(in srgb, var(--ctaText) 80%, transparent)", fontSize: 14, marginBottom: 4 }}>{currentProfile.city}</p>
              <p style={{ color: "color-mix(in srgb, var(--ctaText) 70%, transparent)", fontSize: 14, margin: 0 }}>{currentProfile.bio}</p>
            </div>
          </div>
        )}
      </div>

      {!loading && currentProfile && (
        <div className="discover-swipe-actions" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 18, padding: "14px 0 6px" }}>
          <button onClick={() => addToast("Rewind is unavailable in buffered mode", "info")} style={actionBtnStyle("var(--surface2)", 54, "rewind")} aria-label="Rewind"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg></button>
          <button onClick={() => { pulseButton("pass"); handleAction("PASS", "left"); }} style={actionBtnStyle("color-mix(in srgb, var(--surface2) 90%, var(--rose-glow))", 54, "pass")} aria-label="Pass"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text)" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
          <button onClick={() => { pulseButton("like"); handleAction("LIKE", "right"); }} style={actionBtnStyle("var(--accent)", 56, "like")} aria-label="Like"><svg width="24" height="24" viewBox="0 0 24 24" fill="var(--ctaText)" stroke="var(--ctaText)" strokeWidth="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg></button>
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
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{ALL_INTERESTS.map((interest) => <Chip key={interest} label={interest} selected={selectedInterests.includes(interest)} onClick={() => setSelectedInterests((prev) => prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest])} />)}</div>
          </div>
          <Button fullWidth onClick={() => { setFilterOpen(false); reload(); }}>Apply Filters</Button>
          <button onClick={toggle} style={{ border: "1px solid var(--border)", background: "var(--surface2)", borderRadius: "var(--radius-md)", padding: "12px 14px", textAlign: "left", fontWeight: 600 }}>Theme: {theme === "light" ? "Light" : "Dark"}</button>
        </div>
      </BottomSheet>

      {showDiscoverDebugStatus && syncWarning && <div style={{ textAlign: "center", padding: "4px 12px", fontSize: 12, color: "var(--muted)" }}>Syncing swipes in background...</div>}
      {showDiscoverDebugStatus && <div style={{ textAlign: "center", paddingBottom: 8, fontSize: 11, color: "var(--muted)" }}>Buffered discover enabled ({batchSize} batch / refill below {lowWatermark})</div>}
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
