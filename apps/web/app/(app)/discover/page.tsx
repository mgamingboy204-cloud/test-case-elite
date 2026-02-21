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
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import type { CSSProperties } from "react";

interface Profile {
  id: string;
  userId: string;
  name: string;
  age: number;
  city: string;
  bio: string;
  photo: string;
  verified: boolean;
  premium: boolean;
}

const ALL_INTERESTS = ["Travel", "Fitness", "Music", "Cooking", "Reading", "Photography", "Movies", "Art", "Hiking", "Gaming", "Yoga", "Dancing"];

export default function DiscoverPage() {
  const { addToast } = useToast();
  const [intent, setIntent] = useState("all");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
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

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const interestQuery = selectedInterests.length ? `&interests=${encodeURIComponent(selectedInterests.join(","))}` : "";
      const data = await apiFetch<any>(`/discover/feed?intent=${intent}&limit=24${interestQuery}`);
      const items = Array.isArray(data?.items) ? data.items : [];
      const mapped: Profile[] = items.map((item: any) => ({
        id: item.userId,
        userId: item.userId,
        name: item.name ?? "Member",
        age: Number(item.age ?? 18),
        city: item.city ?? "",
        bio: item.bioShort ?? "",
        photo: item.primaryPhotoUrl ?? "",
        verified: item.videoVerificationStatus === "APPROVED",
        premium: false,
      }));
      setProfiles(mapped);
      setCurrentIndex(0);
    } catch {
      setError(true);
      setProfiles([]);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  }, [intent, distance, selectedInterests]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

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

  const currentProfile = profiles[currentIndex];

  const handleAction = useCallback(
    async (type: "LIKE" | "PASS", direction?: "left" | "right") => {
      if (!currentProfile || animatingOut) return;

      setAnimatingOut(true);
      setSwipeDirection(direction || (type === "PASS" ? "left" : "right"));
      setSwipeX(direction === "left" || type === "PASS" ? -500 : 500);

      try {
        await apiFetch("/likes", {
          method: "POST",
          body: { toUserId: currentProfile.userId, type } as never,
        });
      } catch {
        /* stub */
      }

      const feedbackMessages: Record<string, string> = {
        LIKE: "Liked!",
        PASS: "Passed",
      };

      addToast(feedbackMessages[type], type === "PASS" ? "info" : "success");

      setTimeout(() => {
        setCurrentIndex((i) => i + 1);
        setSwipeX(0);
        setSwipeY(0);
        setSwipeDirection(null);
        setAnimatingOut(false);
      }, 250);
    },
    [currentProfile, animatingOut, addToast]
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
    color: "#fff",
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
      {/* Top header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 8px 8px",
          gap: 8,
        }}
      >
        <span
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: "var(--primary)",
            display: "none",
          }}
          className="discover-wordmark"
        >
          Elite Match
        </span>

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
          style={{ flex: 1, maxWidth: 300, margin: "0 auto" }}
        />

        <button
          onClick={() => setFilterOpen(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            background: "var(--panel)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            color: "var(--text)",
            flexShrink: 0,
          }}
          aria-label="Open filters"
        >
          {"\u2699"}
        </button>
      </div>

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
          <ErrorState onRetry={fetchProfiles} />
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
            <img
              src={currentProfile.photo || "/placeholder.svg"}
              alt={currentProfile.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                position: "absolute",
                inset: 0,
              }}
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
                  background: "rgba(255,255,255,0.9)",
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
                  background: "rgba(255,255,255,0.9)",
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
                background: "linear-gradient(transparent, rgba(0,0,0,0.75))",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "0 24px 24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <h2 style={{ color: "#fff", margin: 0, fontSize: 26 }}>
                  {currentProfile.name}, {currentProfile.age}
                </h2>
                {currentProfile.verified && (
                  <Badge variant="success" style={{ fontSize: 11 }}>Verified</Badge>
                )}
                {currentProfile.premium && (
                  <Badge variant="primary" style={{ fontSize: 11 }}>Premium</Badge>
                )}
              </div>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, marginBottom: 4 }}>
                {currentProfile.city}
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, margin: 0 }}>
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
              if (currentIndex > 0) {
                setCurrentIndex((i) => i - 1);
                addToast("Rewound", "info");
              }
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
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => handleAction("LIKE", "right")}
            style={actionBtnStyle("var(--success)", 54)}
            aria-label="Like"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" stroke="#fff" strokeWidth="1">
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
              fetchProfiles();
            }}
          >
            Apply Filters
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
