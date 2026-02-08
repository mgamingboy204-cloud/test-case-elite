"use client";

import type { CSSProperties, PointerEvent } from "react";
import { getAssetUrl, isValidImageUrl } from "../../../lib/assets";
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
  isDragging?: boolean;
  isInteractionDisabled?: boolean;
  isFlipped?: boolean;
  onLike?: () => void;
  onPass?: () => void;
  onInfo?: () => void;
  onFlipBack?: () => void;
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
  isDragging,
  isInteractionDisabled,
  isFlipped,
  onLike,
  onPass,
  onInfo,
  onFlipBack,
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
  const photoUrlCandidate = getAssetUrl(photoUrlRaw);
  const photoUrl = isValidImageUrl(photoUrlCandidate) ? photoUrlCandidate : null;
  const fallbackInitial = profile?.name?.slice(0, 1)?.toUpperCase() ?? "?";
  const swipeClass =
    isAnimating && swipeDirection ? styles[`cardSwipe${swipeDirection === "left" ? "Left" : "Right"}`] : "";
  const ageValue = typeof profile?.age === "number" ? profile.age : null;
  const ariaLabel = profile
    ? `${profile.name}${ageValue !== null ? `, ${ageValue}` : ""}`
    : "Loading profile";
  const interests = profile?.preferences?.interests ?? [];

  return (
    <article
      className={`${styles.card} ${isActive ? styles.cardActive : ""} ${
        isPlaceholder ? styles.cardSkeleton : ""
      } ${swipeClass} ${isDragging ? styles.cardDragging : ""} ${
        isInteractionDisabled ? styles.cardInteractionDisabled : ""
      } ${isFlipped ? styles.cardFlipped : ""}`}
      style={style}
      onPointerDown={isPlaceholder ? undefined : onPointerDown}
      onPointerMove={isPlaceholder ? undefined : onPointerMove}
      onPointerUp={isPlaceholder ? undefined : onPointerUp}
      onPointerCancel={isPlaceholder ? undefined : onPointerCancel}
      tabIndex={isPlaceholder ? -1 : 0}
      aria-label={ariaLabel}
    >
      <div className={styles.cardInner}>
        <div className={`${styles.cardFace} ${styles.cardFaceFront}`}>
          <div className={styles.cardMedia}>
            {isPlaceholder ? (
              <div className={styles.mediaSkeleton} />
            ) : photoUrl ? (
              <img src={photoUrl} alt={`${profile?.name ?? "Profile"} photo`} />
            ) : (
              <div className={styles.mediaFallback}>{fallbackInitial}</div>
            )}
            {!isPlaceholder && profile ? (
              <div className={styles.cardOverlay}>
                <h2>
                  {profile.name}
                  {ageValue !== null ? <span>{ageValue}</span> : null}
                </h2>
                {profile.city ? <p className={styles.cardCity}>{profile.city}</p> : null}
                {profile.bioShort ? <p className={styles.cardBioLine}>{profile.bioShort}</p> : null}
              </div>
            ) : null}
            {!isPlaceholder && isActive ? (
              <div className={styles.cardActions}>
                <button
                  className={`${styles.cardActionButton} ${styles.cardActionPass}`}
                  type="button"
                  aria-label="Pass"
                  onClick={(event) => {
                    event.stopPropagation();
                    onPass?.();
                  }}
                  disabled={Boolean(isAnimating || isInteractionDisabled)}
                >
                  ✕
                </button>
                <button
                  className={`${styles.cardActionButton} ${styles.cardActionInfo}`}
                  type="button"
                  aria-label="Profile info"
                  onClick={(event) => {
                    event.stopPropagation();
                    onInfo?.();
                  }}
                  disabled={Boolean(isAnimating || isInteractionDisabled)}
                >
                  i
                </button>
                <button
                  className={`${styles.cardActionButton} ${styles.cardActionLike}`}
                  type="button"
                  aria-label="Like"
                  onClick={(event) => {
                    event.stopPropagation();
                    onLike?.();
                  }}
                  disabled={Boolean(isAnimating || isInteractionDisabled)}
                >
                  ❤
                </button>
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
                    {profile?.name}
                    {ageValue !== null ? <span>{ageValue}</span> : null}
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
        </div>
        <div className={`${styles.cardFace} ${styles.cardFaceBack}`} aria-hidden={!isFlipped}>
          <div className={styles.cardBackHeader}>
            <div>
              <h2>
                {profile?.name}
                {ageValue !== null ? <span>{ageValue}</span> : null}
              </h2>
              {profile?.city ? <p>{profile.city}</p> : null}
            </div>
            <button
              type="button"
              className={styles.cardBackClose}
              aria-label="Back to profile photo"
              onClick={(event) => {
                event.stopPropagation();
                onFlipBack?.();
              }}
            >
              ✕
            </button>
          </div>
          <div className={styles.cardBackContent}>
            {visibleTags.length ? (
              <div className={styles.cardBackBadges}>
                {visibleTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}
            {profile?.bioShort ? <p className={styles.cardBackBio}>{profile.bioShort}</p> : null}
            {interests.length ? (
              <div className={styles.cardBackSection}>
                <h3>Interests</h3>
                <div className={styles.cardBackInterests}>
                  {interests.map((interest) => (
                    <span key={interest}>{interest}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
