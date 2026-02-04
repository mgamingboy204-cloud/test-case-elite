"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { apiFetch } from "../../../lib/api";
import { getAssetUrl } from "../../../lib/assets";
import RouteGuard from "../../components/RouteGuard";

type Status = "idle" | "loading" | "success" | "error";
type Profile = {
  userId: string;
  name: string;
  gender: string;
  age: number;
  city: string;
  profession: string;
  bioShort: string;
  primaryPhotoUrl?: string | null;
  photos: string[];
};

const PAGE_SIZE = 8;
const SWIPE_THRESHOLD = 120;

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [emptySince, setEmptySince] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0, active: false });
  const [mode, setMode] = useState<"dating" | "friends">("dating");
  const seenUserIds = useRef(new Set<string>());
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const activeProfile = useMemo(() => profiles[0], [profiles]);

  useEffect(() => {
    if (profiles.length <= 3 && hasMore && !isFetching) {
      void loadProfiles();
    }
  }, [profiles.length, hasMore, isFetching, mode]);

  useEffect(() => {
    seenUserIds.current.clear();
    setProfiles([]);
    setPage(1);
    setHasMore(true);
    setEmptySince(null);
    void loadProfiles(true);
  }, [mode]);

  useEffect(() => {
    if (profiles.length || isFetching) {
      setEmptySince(null);
      return;
    }
    setEmptySince((prev) => prev ?? Date.now());
  }, [profiles.length, isFetching]);

  useEffect(() => {
    if (!emptySince) return;
    const timer = setTimeout(() => {
      void loadProfiles(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [emptySince, mode]);

  async function loadProfiles(reset = false, nextMode: "dating" | "friends" = mode) {
    if (isFetching) return;
    const nextPage = reset ? 1 : page;
    setIsFetching(true);
    setStatus("loading");
    setMessage(reset ? "Loading curated introductions..." : "Fetching more profiles...");
    try {
      const data = await apiFetch<{ profiles: Profile[] }>(
        `/profiles?page=${nextPage}&pageSize=${PAGE_SIZE}&mode=${nextMode}`
      );
      const fetched = data.profiles ?? [];
      const incoming = fetched.filter((profile) => !seenUserIds.current.has(profile.userId));
      incoming.forEach((profile) => seenUserIds.current.add(profile.userId));
      setProfiles((prev) => (reset ? incoming : [...prev, ...incoming]));
      setPage(nextPage + 1);
      setHasMore(fetched.length === PAGE_SIZE);
      setStatus("success");
      if (incoming.length) {
        setMessage("Here is your next introduction.");
      } else if (reset) {
        setMessage("No profiles yet. We’ll keep checking for new introductions.");
      } else {
        setMessage("No more profiles right now. We’ll keep checking for new introductions.");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to load profiles.");
    } finally {
      setIsFetching(false);
    }
  }

  async function sendLike(profile: Profile, type: "LIKE" | "PASS") {
    setMessage(type === "LIKE" ? "Sending like..." : "Recording pass...");
    setStatus("loading");
    setProfiles((prev) => prev.slice(1));
    try {
      await apiFetch("/likes", {
        method: "POST",
        body: JSON.stringify({ toUserId: profile.userId, type })
      });
      setStatus("success");
      setMessage(type === "LIKE" ? "Like sent!" : "Pass recorded.");
    } catch (error) {
      setProfiles((prev) => [profile, ...prev]);
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send action.");
    } finally {
      setDragOffset({ x: 0, y: 0, active: false });
    }
  }

  function handlePointerDown(event: PointerEvent) {
    if (!activeProfile) return;
    dragStart.current = { x: event.clientX, y: event.clientY };
    dragOffsetRef.current = { x: 0, y: 0 };
    setDragOffset({ x: 0, y: 0, active: true });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent) {
    if (!dragStart.current) return;
    const deltaX = event.clientX - dragStart.current.x;
    const deltaY = event.clientY - dragStart.current.y;
    dragOffsetRef.current = { x: deltaX, y: deltaY };
    setDragOffset({ x: deltaX, y: deltaY, active: true });
  }

  function handlePointerEnd() {
    if (!dragStart.current || !activeProfile) {
      setDragOffset({ x: 0, y: 0, active: false });
      return;
    }
    const { x } = dragOffsetRef.current;
    dragStart.current = null;
    if (x > SWIPE_THRESHOLD) {
      void sendLike(activeProfile, "LIKE");
      return;
    }
    if (x < -SWIPE_THRESHOLD) {
      void sendLike(activeProfile, "PASS");
      return;
    }
    setDragOffset({ x: 0, y: 0, active: false });
  }

  const stackProfiles = profiles.slice(0, 3);
  const dragStyle = activeProfile
    ? {
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x / 14}deg)`,
        transition: dragOffset.active ? "none" : "transform 0.2s ease"
      }
    : undefined;

  return (
    <RouteGuard>
      <div className="grid two-column">
        <section className="card">
          <h2>Discover</h2>
          <p className="card-subtitle">Swipe-style introductions, one at a time.</p>
          <div className="button-row">
            <button
              onClick={() => setMode("dating")}
              className={mode === "dating" ? "secondary" : undefined}
              type="button"
            >
              Dating
            </button>
            <button
              onClick={() => setMode("friends")}
              className={mode === "friends" ? "secondary" : undefined}
              type="button"
            >
              Find friends
            </button>
          </div>
          <button onClick={() => loadProfiles(true)} disabled={isFetching}>
            {isFetching ? "Refreshing..." : "Load Profiles"}
          </button>
          {message ? <p className={`message ${status}`}>{message}</p> : null}
        </section>

        <section className="card swipe-card">
          {activeProfile ? (
            <div className="swipe-stack">
              {stackProfiles.map((profile, index) => {
                const isTop = index === 0;
                const depth = Math.min(index, 2);
                const photoUrlRaw = profile.primaryPhotoUrl ?? profile.photos?.[0];
                const photoUrl = getAssetUrl(photoUrlRaw);
                return (
                  <article
                    key={profile.userId}
                    className={`swipe-profile ${isTop ? "active" : ""}`}
                    style={{
                      zIndex: stackProfiles.length - index,
                      transform: isTop
                        ? dragStyle?.transform
                        : `translateY(${depth * 10}px) scale(${1 - depth * 0.03})`,
                      transition: isTop ? dragStyle?.transition : "transform 0.2s ease"
                    }}
                    onPointerDown={isTop ? handlePointerDown : undefined}
                    onPointerMove={isTop ? handlePointerMove : undefined}
                    onPointerUp={isTop ? handlePointerEnd : undefined}
                    onPointerCancel={isTop ? handlePointerEnd : undefined}
                  >
                    <div className="swipe-photo">
                      {photoUrl ? (
                        <img src={photoUrl} alt={`${profile.name}'s profile photo`} />
                      ) : (
                        <div className="swipe-photo-placeholder">{profile.name.slice(0, 1)}</div>
                      )}
                    </div>
                    <div className="swipe-details">
                      <div className="swipe-header">
                        <h3>{profile.name}</h3>
                        <span className="badge">
                          {profile.gender === "MALE" ? "Male" : profile.gender === "FEMALE" ? "Female" : "Other"}
                        </span>
                      </div>
                      <p className="swipe-meta">
                        {profile.age} • {profile.city}
                      </p>
                      <p className="swipe-title">{profile.profession}</p>
                      <p className="swipe-bio">{profile.bioShort}</p>
                    </div>
                  </article>
                );
              })}
              <div className="swipe-actions">
                <button onClick={() => activeProfile && sendLike(activeProfile, "PASS")} className="secondary">
                  Pass
                </button>
                <button onClick={() => activeProfile && sendLike(activeProfile, "LIKE")}>Like</button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No more profiles</h3>
              <p>Check back soon or refresh to load new introductions.</p>
            </div>
          )}
        </section>
      </div>
    </RouteGuard>
  );
}
