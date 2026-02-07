"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { getAssetUrl } from "../../lib/assets";
import { queryKeys } from "../../lib/queryKeys";
import RouteGuard from "../components/RouteGuard";
import AppShellLayout from "../components/ui/AppShellLayout";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import ErrorState from "../components/ui/ErrorState";
import LoadingState from "../components/ui/LoadingState";

type Status = "idle" | "loading" | "success" | "error";

type Profile = {
  userId: string;
  name: string;
  gender: string;
  age: number;
  city: string;
  bioShort: string;
  primaryPhotoUrl?: string | null;
  photos: string[];
};

type ProfileResponse = { profiles: Profile[] };

type DetailResponse = { profile: any };

const PAGE_SIZE = 8;
const SWIPE_THRESHOLD = 120;
const SWIPE_DETAIL_THRESHOLD = 80;

export default function DiscoverPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0, active: false });
  const [mode, setMode] = useState<"dating" | "friends">("dating");
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const ignoreClickRef = useRef(false);
  const sheetDragStart = useRef<{ y: number } | null>(null);

  const profilesQuery = useQuery({
    queryKey: queryKeys.discoverFeed(mode),
    queryFn: () =>
      apiFetch<ProfileResponse>(`/profiles?page=1&pageSize=${PAGE_SIZE}&mode=${mode}`),
    staleTime: 15000
  });

  const profiles = profilesQuery.data?.profiles ?? [];
  const activeProfile = useMemo(() => profiles[0], [profiles]);

  useEffect(() => {
    if (profilesQuery.isError) {
      setStatus("error");
      setMessage(
        profilesQuery.error instanceof Error ? profilesQuery.error.message : "Unable to load profiles."
      );
    }
  }, [profilesQuery.isError, profilesQuery.error]);

  useEffect(() => {
    if (!profilesQuery.isSuccess) return;
    setStatus("success");
    if (profiles.length) {
      setMessage("Here is your next introduction.");
    } else {
      setMessage("No profiles yet. We’ll keep checking for new introductions.");
    }
  }, [profilesQuery.isSuccess, profiles.length, mode]);

  const likeMutation = useMutation({
    mutationFn: ({ profile, type }: { profile: Profile; type: "LIKE" | "PASS" }) =>
      apiFetch("/likes", {
        method: "POST",
        body: JSON.stringify({ toUserId: profile.userId, type })
      }),
    onMutate: async ({ profile }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.discoverFeed(mode) });
      const previous = queryClient.getQueryData<ProfileResponse>(queryKeys.discoverFeed(mode));
      queryClient.setQueryData<ProfileResponse>(queryKeys.discoverFeed(mode), (old) => {
        const nextProfiles = (old?.profiles ?? []).filter((item) => item.userId !== profile.userId);
        return { profiles: nextProfiles };
      });
      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.discoverFeed(mode), context.previous);
      }
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to send action.");
    },
    onSuccess: (_data, variables) => {
      setStatus("success");
      setMessage(variables.type === "LIKE" ? "Like sent!" : "Pass recorded.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.discoverFeed(mode) });
      queryClient.invalidateQueries({ queryKey: queryKeys.matches });
      queryClient.invalidateQueries({ queryKey: queryKeys.likes });
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsCount });
    }
  });

  const detailQuery = useQuery({
    queryKey: queryKeys.profile(detailUserId),
    queryFn: () => apiFetch<DetailResponse>(`/profiles/${detailUserId}`),
    enabled: Boolean(detailUserId),
    staleTime: 30000
  });

  const detailProfile = detailQuery.data?.profile ?? null;
  const detailStatus: Status = detailUserId
    ? detailQuery.isLoading
      ? "loading"
      : detailQuery.isError
        ? "error"
        : "success"
    : "idle";

  function refreshProfiles() {
    setStatus("loading");
    setMessage("Loading curated introductions...");
    void profilesQuery.refetch();
  }

  function sendLike(profile: Profile, type: "LIKE" | "PASS") {
    setMessage(type === "LIKE" ? "Sending like..." : "Recording pass...");
    setStatus("loading");
    likeMutation.mutate({ profile, type });
    setDragOffset({ x: 0, y: 0, active: false });
  }

  function openDetail(profile: Profile) {
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }
    setDetailUserId(profile.userId);
  }

  function closeDetail() {
    setDetailUserId(null);
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
    const { x, y } = dragOffsetRef.current;
    const absX = Math.abs(x);
    const absY = Math.abs(y);
    dragStart.current = null;
    if (absY > absX && y < -SWIPE_DETAIL_THRESHOLD) {
      ignoreClickRef.current = true;
      openDetail(activeProfile);
      setDragOffset({ x: 0, y: 0, active: false });
      return;
    }
    if (absX > absY && x > SWIPE_THRESHOLD) {
      ignoreClickRef.current = true;
      sendLike(activeProfile, "LIKE");
      return;
    }
    if (absX > absY && x < -SWIPE_THRESHOLD) {
      ignoreClickRef.current = true;
      sendLike(activeProfile, "PASS");
      return;
    }
    setDragOffset({ x: 0, y: 0, active: false });
  }

  function handleSheetPointerDown(event: PointerEvent<HTMLDivElement>) {
    sheetDragStart.current = { y: event.clientY };
  }

  function handleSheetPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!sheetDragStart.current) return;
    const deltaY = event.clientY - sheetDragStart.current.y;
    sheetDragStart.current = null;
    if (deltaY > 80) {
      closeDetail();
    }
  }

  const stackProfiles = profiles.slice(0, 3);
  const dragStyle = activeProfile
    ? {
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${dragOffset.x / 14}deg)`,
        transition: dragOffset.active ? "none" : "transform 0.2s ease"
      }
    : undefined;
  const detailInterests = detailProfile?.preferences?.interests ?? detailProfile?.interests ?? [];
  const detailPhotos = detailProfile?.photos ?? detailProfile?.photoUrls ?? [];
  const detailIntent = detailProfile?.intent ?? detailProfile?.preferences?.intent;
  const detailDistance = detailProfile?.distance ?? detailProfile?.preferences?.distance;
  const isFetching = profilesQuery.isFetching;

  return (
    <RouteGuard requireActive>
      <AppShellLayout
        rightPanel={
          <>
            <Card>
              <h3>Filters</h3>
              <div className="form">
                <div className="field">
                  <label>Distance</label>
                  <input placeholder="Within 25 miles" disabled />
                </div>
                <div className="field">
                  <label>Intent</label>
                  <div className="tabs">
                    <button
                      type="button"
                      className={mode === "dating" ? "tab active" : "tab"}
                      onClick={() => setMode("dating")}
                    >
                      Dating
                    </button>
                    <button
                      type="button"
                      className={mode === "friends" ? "tab active" : "tab"}
                      onClick={() => setMode("friends")}
                    >
                      Friends
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label>Age range</label>
                  <input placeholder="26 - 38" disabled />
                </div>
              </div>
            </Card>
            <Card>
              <h3>Quick actions</h3>
              <Button variant="secondary" onClick={refreshProfiles} disabled={isFetching}>
                {isFetching ? "Refreshing..." : "Refresh feed"}
              </Button>
            </Card>
          </>
        }
      >
        <div className="discover-grid">
          <div className="discover-mobile-header">
            <span className="text-muted">Curated introductions</span>
            <button className="text-button" type="button" onClick={refreshProfiles} disabled={isFetching}>
              {isFetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {profilesQuery.isLoading && !profiles.length ? (
            <LoadingState message="Loading curated introductions..." />
          ) : profilesQuery.isError ? (
            <ErrorState message={message || "Unable to load profiles."} onRetry={refreshProfiles} />
          ) : activeProfile ? (
            <>
              <div className="discover-stack">
                {stackProfiles.map((profile, index) => {
                  const isTop = index === 0;
                  const depth = Math.min(index, 2);
                  const photoUrlRaw = profile.primaryPhotoUrl ?? profile.photos?.[0];
                  const photoUrl = getAssetUrl(photoUrlRaw);
                  return (
                    <article
                      key={profile.userId}
                      className="profile-card"
                      style={{
                        zIndex: stackProfiles.length - index,
                        transform: isTop
                          ? dragStyle?.transform
                          : `translateY(${depth * 12}px) scale(${1 - depth * 0.03})`,
                        transition: isTop ? dragStyle?.transition : "transform 0.2s ease",
                        pointerEvents: isTop ? "auto" : "none"
                      }}
                      onPointerDown={isTop ? handlePointerDown : undefined}
                      onPointerMove={isTop ? handlePointerMove : undefined}
                      onPointerUp={isTop ? handlePointerEnd : undefined}
                      onPointerCancel={isTop ? handlePointerEnd : undefined}
                      onClick={isTop ? () => openDetail(profile) : undefined}
                    >
                      <div className="profile-card__photo">
                        {photoUrl ? (
                          <img src={photoUrl} alt={`${profile.name}'s profile photo`} />
                        ) : (
                          <span>{profile.name.slice(0, 1)}</span>
                        )}
                        <div className="profile-card__overlay">
                          <div>
                            <h3>
                              {profile.name} <span>{profile.age}</span>
                            </h3>
                            <p>{profile.city}</p>
                          </div>
                        </div>
                      </div>
                      <div className="profile-card__content">
                        <h3>
                          {profile.name} <span className="text-muted">{profile.age}</span>
                        </h3>
                        <p className="text-muted">{profile.city}</p>
                        <div className="chip-row">
                          {["Serious", "Local", "Verified"].map((tag) => (
                            <span key={tag} className="chip">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p>{profile.bioShort}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="discover-actions">
                <button
                  className="circle-action"
                  onClick={() => activeProfile && sendLike(activeProfile, "PASS")}
                  aria-label="Pass"
                >
                  ✕
                </button>
                <button
                  className="circle-action primary"
                  onClick={() => activeProfile && sendLike(activeProfile, "LIKE")}
                  aria-label="Like"
                >
                  ✔
                </button>
              </div>
              <div className="discover-actions discover-actions--mobile">
                <button
                  className="circle-action"
                  onClick={() => activeProfile && sendLike(activeProfile, "PASS")}
                  aria-label="Pass"
                >
                  ✕
                </button>
                <button
                  className="circle-action super"
                  onClick={() => {
                    setStatus("success");
                    setMessage("Super likes are coming soon.");
                  }}
                  aria-label="Super like"
                >
                  ★
                </button>
                <button
                  className="circle-action primary"
                  onClick={() => activeProfile && sendLike(activeProfile, "LIKE")}
                  aria-label="Like"
                >
                  ❤
                </button>
              </div>
            </>
          ) : (
            <EmptyState
              title="No more profiles"
              message="Check back soon or refresh to load new introductions."
              actionLabel="Refresh feed"
              onAction={refreshProfiles}
            />
          )}
          {message && status !== "error" ? <p className={`message ${status}`}>{message}</p> : null}
        </div>

        {detailStatus !== "idle" ? (
          <div className="profile-modal" onClick={closeDetail} role="presentation">
            <div className="profile-modal__backdrop" />
            <div
              className="profile-modal__content"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={handleSheetPointerDown}
              onPointerUp={handleSheetPointerUp}
            >
              <button className="profile-modal__handle" onClick={closeDetail} type="button" aria-label="Close">
                ⌄
              </button>
              {detailStatus === "loading" ? (
                <div className="modal-loading">
                  <div className="skeleton-block" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line short" />
                </div>
              ) : detailStatus === "error" ? (
                <div className="modal-body">
                  <button className="modal-close" onClick={closeDetail} type="button">
                    Close
                  </button>
                  <p className="message error">Unable to load profile details.</p>
                </div>
              ) : detailProfile ? (
                <div className="modal-body">
                  <div className="modal-photo">
                    {detailProfile.primaryPhotoUrl ? (
                      <img src={getAssetUrl(detailProfile.primaryPhotoUrl) ?? ""} alt={detailProfile.name} />
                    ) : null}
                  </div>
                  <div className="modal-details">
                    <h3>
                      {detailProfile.name} <span>{detailProfile.age}</span>
                    </h3>
                    <p className="card-subtitle">
                      {detailProfile.city} {detailProfile.profession ? `• ${detailProfile.profession}` : ""}
                    </p>
                    {detailProfile.videoVerificationStatus === "APPROVED" ? (
                      <span className="badge verified">Verified</span>
                    ) : null}
                    <p>{detailProfile.bioShort}</p>
                    <div className="detail-meta">
                      <span>{detailProfile.city ?? "Unknown city"}</span>
                      {detailDistance ? <span>{detailDistance} miles away</span> : null}
                      {detailIntent ? <span>{detailIntent}</span> : null}
                    </div>
                    {detailInterests.length ? (
                      <div className="chip-row">
                        {detailInterests.map((interest: string) => (
                          <span key={interest} className="chip">
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    {detailPhotos.length ? (
                      <div className="detail-photo-grid">
                        {detailPhotos.map((photo: any) => {
                          const url = typeof photo === "string" ? photo : photo.url;
                          return (
                            <img key={photo.id ?? url} src={getAssetUrl(url) ?? ""} alt="Profile detail" />
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </AppShellLayout>
    </RouteGuard>
  );
}
