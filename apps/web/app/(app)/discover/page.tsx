"use client";

import React from "react"

import { useState, useRef, useCallback, useEffect } from "react";
import { Tabs } from "@/app/components/ui/Tabs";
import { BottomSheet } from "@/app/components/ui/BottomSheet";
import { Chip } from "@/app/components/ui/Badge";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/app/components/ui/States";
import { Button } from "@/app/components/ui/Button";
import { useTheme, useToast } from "@/app/providers";
import type { CSSProperties } from "react";
import { apiFetch } from "@/lib/api";
import { useDiscoverBuffer } from "./useDiscoverBuffer";

const ALL_INTERESTS = ["Travel", "Fitness", "Music", "Cooking", "Reading", "Photography", "Movies", "Art", "Hiking", "Gaming", "Yoga", "Dancing"];
const PREFETCH_CARD_COUNT = 2;

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
  const intentInitializedRef = useRef(false);
  const intentManuallyChangedRef = useRef(false);

  /* Swipe state */
  const cardRef = useRef<HTMLDivElement>(null);
  const [swipeX, setSwipeX] = useState(0);
  const [swipeY, setSwipeY] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [animatingOut, setAnimatingOut] = useState(false);
  const committedActionIdsRef = useRef(new Set<string>());

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

  useEffect(() => {
    if (intentInitializedRef.current) return;

    const setInitialIntentTab = async () => {
      try {
        const data = await apiFetch<any>("/profile");
        const profileIntent = String(data?.profile?.intent ?? "").toLowerCase();
        if (intentManuallyChangedRef.current) return;
        if (profileIntent === "dating") {
          setIntent("dating");
        } else if (profileIntent === "friends") {
          setIntent("friends");
        } else {
          setIntent("all");
        }
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

      const actionId = `${currentProfile.userId}:${type}`;
      if (committedActionIdsRef.current.has(actionId)) {
        return;
      }
      committedActionIdsRef.current.add(actionId);

      setAnimatingOut(true);
      setSwipeDirection(direction || (type === "PASS" ? "left" : "right"));
      setSwipeX(direction === "left" || type === "PASS" ? -500 : 500);
      advance({ actionId, type });

      if (type === "PASS") {
        addToast("Passed", "info");
      }

      setTimeout(() => {
        setSwipeX(0);
        setSwipeY(0);
        setSwipeDirection(null);
        setAnimatingOut(false);
      }, 250);
    },
    [currentProfile, animatingOut, addToast, advance]
  );

  /* Pointer handlers for swipe */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (animatingOut) return;
      setSwiping(true);
      startPos.current = { x: e.clientX, y: e.clientY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [animatingOut]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!swiping) return;
      const dx = e.clientX - startPos.current.x;
      const dy = (e.clientY - startPos.current.y) * 0.3;
      setSwipeX(dx);
      setSwipeY(dy);
    },
    [swiping]
  );

  const handlePointerUp = useCallback(() => {
    if (!swiping) return;
    setSwiping(false);

    const threshold = 100;
    if (swipeX > threshold) {
      handleAction("LIKE", "right");
    } else if (swipeX < -threshold) {
      handleAction("PASS", "left");
    } else {
      setSwipeX(0);
      setSwipeY(0);
    }
  }, [swiping, swipeX, handleAction]);

  const [photoLoaded, setPhotoLoaded] = useState(false);
  const prefetchCacheRef = useRef(new Set<string>());

  const currentPhotoSrc = toDiscoverImageUrl(currentProfile?.photo);

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

  const showDiscoverDebugStatus =
    process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_DEBUG_DISCOVER_STATUS === "true";

  const cardStyle: CSSProperties = {
    width: "min(92vw, 380px)",
    height: "clamp(520px, 70vh, 640px)",
    borderRadius: 30,
    overflow: "hidden",
    boxShadow: "var(--shadow-xl)",
    position: "relative",
    margin: "0 auto",
    touchAction: "none",
    userSelect: "none",
    transform: `translateX(${swipeX}px) translateY(${swipeY}px) rotate(${swipeX * 0.06}deg)`,
    transition: swiping ? "none" : "transform 250ms cubic-bezier(0.32, 0.72, 0, 1)",
    cursor: swiping ? "grabbing" : "grab",
    willChange: "transform",
  };

  /* Action button style helper */
  const actionBtnStyle = (bg: string, size = 56): CSSProperties => ({
    width: size,
    height: size,
    borderRadius: "50%",
    background: bg,
    border: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.4,
    color: "var(--ctaText)",
    boxShadow: "var(--shadow-md)",
    cursor: "pointer",
    transition: "transform 150ms ease, box-shadow 150ms ease",
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100dvh - var(--app-header-offset))",
        overflow: "hidden",
        paddingBottom: "calc(var(--bn) + var(--sab) + 90px)",
      }}
    >
      {/* Card area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px 0",
          position: "relative",
        }}
      >
        {loading ? (
          <div
            style={{
              width: "min(92vw, 380px)",
              height: "clamp(520px, 70vh, 640px)",
              borderRadius: 30,
              overflow: "hidden",
            }}
          >
            <Skeleton width="100%" height="100%" radius={30} />
          </div>
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : !currentProfile ? (
          <EmptyState
            title="No more profiles"
            description="Adjust your filters or check back later for new people."
            action={{ label: "Adjust Filters", onClick: () => setFilterOpen(true) }}
            icon={
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M16 16s-1.5-2-4-2-4 2-4 2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
            }
          />
        ) : (
          /* Swipe Card */
          <div
            ref={cardRef}
            style={cardStyle}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Photo */}
            {!photoLoaded && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(120deg, var(--pearl-panel), color-mix(in srgb, var(--pearl-panel) 65%, var(--text)), var(--pearl-panel))",
                }}
              />
            )}
            <img
              src={currentPhotoSrc}
              alt={currentProfile.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                inset: 0,
                opacity: photoLoaded ? 1 : 0,
                transition: "opacity 180ms ease-out",
              }}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              onLoad={() => setPhotoLoaded(true)}
              crossOrigin="anonymous"
              draggable={false}
            />

            {/* Swipe indicators */}
            {swipeX > 30 && (
              <div
                style={{
                  position: "absolute",
                  top: 40,
                  left: 24,
                  padding: "8px 16px",
                  border: "3px solid var(--success)",
                  color: "var(--success)",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 800,
                  fontSize: 28,
                  transform: "rotate(-20deg)",
                  opacity: Math.min(swipeX / 100, 1),
                  background: "color-mix(in srgb, var(--surface) 88%, transparent)",
                }}
              >
                LIKE
              </div>
            )}
            {swipeX < -30 && (
              <div
                style={{
                  position: "absolute",
                  top: 40,
                  right: 24,
                  padding: "8px 16px",
                  border: "3px solid var(--danger)",
                  color: "var(--danger)",
                  borderRadius: "var(--radius-md)",
                  fontWeight: 800,
                  fontSize: 28,
                  transform: "rotate(20deg)",
                  opacity: Math.min(Math.abs(swipeX) / 100, 1),
                  background: "color-mix(in srgb, var(--surface) 88%, transparent)",
                }}
              >
                NOPE
              </div>
            )}

            {/* Bottom gradient overlay */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "45%",
                background: "linear-gradient(transparent, color-mix(in srgb, var(--bg) 82%, transparent))",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "0 24px 24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h2 style={{ color: "var(--ctaText)", margin: 0, fontSize: 26 }}>
                  {currentProfile.name}, {currentProfile.age}
                </h2>
                {currentProfile.verified && (
                  <Badge variant="success" style={{ fontSize: 11 }}>Verified</Badge>
                )}
                {currentProfile.premium && (
                  <Badge variant="primary" style={{ fontSize: 11 }}>Premium</Badge>
                )}
              </div>
              <p style={{ color: "color-mix(in srgb, var(--ctaText) 80%, transparent)", fontSize: 14, marginBottom: 4 }}>
                {currentProfile.city}
              </p>
              <p style={{ color: "color-mix(in srgb, var(--ctaText) 70%, transparent)", fontSize: 14, margin: 0 }}>
                {currentProfile.bio}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!loading && currentProfile && (
        <div
          className="discover-swipe-actions"
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            padding: "12px 0",
          }}
        >
          <button
            onClick={() => {
              addToast("Rewind is unavailable in buffered mode", "info");
            }}
            style={actionBtnStyle("var(--surface2)", 54)}
            aria-label="Rewind"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button
            onClick={() => handleAction("PASS", "left")}
            style={actionBtnStyle("var(--danger)", 54)}
            aria-label="Pass"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--ctaText)" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => handleAction("LIKE", "right")}
            style={actionBtnStyle("var(--success)", 54)}
            aria-label="Like"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--ctaText)" stroke="var(--ctaText)" strokeWidth="1">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>
        </div>
      )}

      {/* Filter BottomSheet */}
      <BottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filters"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div>
            <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: 12 }}>
              Looking for
            </label>
            <Tabs
              tabs={[
                { label: "All", value: "all" },
                { label: "Dating", value: "dating" },
                { label: "Friends", value: "friends" },
              ]}
              active={intent}
              onChange={(next) => {
                intentManuallyChangedRef.current = true;
                setIntent(next);
              }}
            />
          </div>


          <div>
            <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: 12 }}>
              Distance: {distance} km
            </label>
            <input
              type="range"
              min={5}
              max={200}
              value={distance}
              onChange={(e) => setDistance(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--primary)" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "var(--muted)",
                marginTop: 4,
              }}
            >
              <span>5 km</span>
              <span>200 km</span>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 14, fontWeight: 500, display: "block", marginBottom: 12 }}>
              Interests
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ALL_INTERESTS.map((interest) => (
                <Chip
                  key={interest}
                  label={interest}
                  selected={selectedInterests.includes(interest)}
                  onClick={() =>
                    setSelectedInterests((prev) =>
                      prev.includes(interest)
                        ? prev.filter((i) => i !== interest)
                        : [...prev, interest]
                    )
                  }
                />
              ))}
            </div>
          </div>

          <Button
            fullWidth
            onClick={() => {
              setFilterOpen(false);
              reload();
            }}
          >
            Apply Filters
          </Button>
          <button
            onClick={toggle}
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface2)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              textAlign: "left",
              fontWeight: 600,
            }}
          >
            Theme: {theme === "light" ? "Light" : "Dark"}
          </button>
        </div>
      </BottomSheet>

      {showDiscoverDebugStatus && syncWarning && (
        <div style={{ textAlign: "center", padding: "4px 12px", fontSize: 12, color: "var(--muted)" }}>
          Syncing swipes in background...
        </div>
      )}

      {showDiscoverDebugStatus && (
        <div style={{ textAlign: "center", paddingBottom: 8, fontSize: 11, color: "var(--muted)" }}>
          Buffered discover enabled ({batchSize} batch / refill below {lowWatermark})
        </div>
      )}

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
