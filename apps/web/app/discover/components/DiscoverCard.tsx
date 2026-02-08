"use client";

import type { CSSProperties, PointerEvent } from "react";
import { getAssetUrl } from "../../../lib/assets";
import type { DiscoverProfile } from "../useDiscoverFeed";
import styles from "../discover.module.css";

const fallbackTags = ["Local", "Serious"];

function formatTag(tag: string) {
  return tag
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildTags(profile?: DiscoverProfile) {
  if (!profile) return fallbackTags;
  const tags = new Set<string>();
  if (profile.videoVerificationStatus === "APPROVED") tags.add("Verified");
  const intentTag = profile.preferences?.intent ? formatTag(profile.preferences.intent) : null;
  if (intentTag) tags.add(intentTag);
  const distanceTag = profile.preferences?.distance ? formatTag(profile.preferences.distance) : null;
  if (distanceTag) tags.add(distanceTag);
  fallbackTags.forEach((tag) => tags.add(tag));
  return Array.from(tags);
}

type DiscoverCardProps = {
  profile?: DiscoverProfile;
  isActive?: boolean;
  isPlaceholder?: boolean;
  swipeDirection?: "left" | "right" | null;
  isAnimating?: boolean;
  isExpanded?: boolean;
  isDragging?: boolean;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel?: (event: PointerEvent<HTMLElement>) => void;
  style?: CSSProperties;
};

export default function DiscoverCard({
  profile,
  isActive,
  isPlaceholder,
  swipeDirection,
  isAnimating,
  isExpanded,
  isDragging,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  style
}: DiscoverCardProps) {
  const tags = buildTags(profile);
  const visibleTags = tags.slice(0, 6);
  const extraTagCount = Math.max(0, tags.length - visibleTags.length);
  const photoUrlRaw = profile?.primaryPhotoUrl;
  const photoUrl = getAssetUrl(photoUrlRaw);
  const swipeClass =
    isAnimating && swipeDirection ? styles[`cardSwipe${swipeDirection === "left" ? "Left" : "Right"}`] : "";

  return (
    <article
      className={`${styles.card} ${isActive ? styles.cardActive : ""} ${
        isPlaceholder ? styles.cardSkeleton : ""
      } ${swipeClass} ${isExpanded ? styles.cardExpanded : ""} ${isDragging ? styles.cardDragging : ""}`}
      style={style}
      onPointerDown={isPlaceholder ? undefined : onPointerDown}
      onPointerMove={isPlaceholder ? undefined : onPointerMove}
      onPointerUp={isPlaceholder ? undefined : onPointerUp}
      onPointerCancel={isPlaceholder ? undefined : onPointerCancel}
      tabIndex={isPlaceholder ? -1 : 0}
      aria-label={profile ? `${profile.name}, ${profile.age}` : "Loading profile"}
    >
      <div className={styles.cardMedia}>
        {isPlaceholder ? (
          <div className={styles.mediaSkeleton} />
        ) : photoUrl ? (
          <img src={photoUrl} alt={`${profile?.name ?? "Profile"} photo`} />
        ) : (
          <div className={styles.mediaFallback}>{profile?.name?.slice(0, 1) ?? "?"}</div>
        )}
        {!isPlaceholder && profile ? (
          <div className={styles.cardOverlay}>
            <h2>
              {profile.name}
            </h2>
            <p>{profile.bioShort || profile.city || ""}</p>
          </div>
        ) : null}
      </div>
      <div className={styles.cardDetails}>
        {isPlaceholder ? (
          <>
            <div className={styles.skeletonLine} />
            <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            <div className={styles.skeletonPillRow}>
              <span className={styles.skeletonPill} />
              <span className={styles.skeletonPill} />
              <span className={styles.skeletonPill} />
            </div>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
          </>
        ) : (
          <>
            <div className={styles.cardHeader}>
              <h2>
                {profile?.name} <span>{profile?.age}</span>
              </h2>
              <p className={styles.cardLocation}>{profile?.city ?? ""}</p>
            </div>
            <div className={styles.chipRow}>
              {visibleTags.map((tag) => (
                <span key={tag} className={styles.chip}>
                  {tag}
                </span>
              ))}
              {extraTagCount > 0 ? (
                <span className={`${styles.chip} ${styles.chipMuted}`}>+{extraTagCount}</span>
              ) : null}
            </div>
            <p className={styles.cardBio}>{profile?.bioShort ?? ""}</p>
          </>
        )}
      </div>
    </article>
  );
}
