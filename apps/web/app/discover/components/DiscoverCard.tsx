"use client";

import type { CSSProperties } from "react";
import { getAssetUrl } from "../../../lib/assets";
import type { DiscoverProfile } from "../useDiscoverFeed";

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
  return Array.from(tags).slice(0, 4);
}

type DiscoverCardProps = {
  profile?: DiscoverProfile;
  isActive?: boolean;
  isPlaceholder?: boolean;
  swipeDirection?: "left" | "right" | null;
  isAnimating?: boolean;
  style?: CSSProperties;
};

export default function DiscoverCard({
  profile,
  isActive,
  isPlaceholder,
  swipeDirection,
  isAnimating,
  style
}: DiscoverCardProps) {
  const tags = buildTags(profile);
  const photoUrlRaw = profile?.primaryPhotoUrl;
  const photoUrl = getAssetUrl(photoUrlRaw);
  const swipeClass = isAnimating && swipeDirection ? `discover-card--swipe-${swipeDirection}` : "";

  return (
    <article
      className={`discover-card ${isActive ? "discover-card--active" : ""} ${
        isPlaceholder ? "discover-card--skeleton" : ""
      } ${swipeClass}`}
      style={style}
      tabIndex={isPlaceholder ? -1 : 0}
      aria-label={profile ? `${profile.name}, ${profile.age}` : "Loading profile"}
    >
      <div className="discover-card__media">
        {isPlaceholder ? (
          <div className="discover-card__media-skeleton" />
        ) : photoUrl ? (
          <img src={photoUrl} alt={`${profile?.name ?? "Profile"} photo`} />
        ) : (
          <div className="discover-card__media-fallback">{profile?.name?.slice(0, 1) ?? "?"}</div>
        )}
      </div>
      <div className="discover-card__details">
        {isPlaceholder ? (
          <>
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
            <div className="skeleton-pill-row">
              <span className="skeleton-pill" />
              <span className="skeleton-pill" />
              <span className="skeleton-pill" />
            </div>
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </>
        ) : (
          <>
            <div className="discover-card__header">
              <h2>
                {profile?.name} <span>{profile?.age}</span>
              </h2>
              <p className="text-muted">{profile?.city ?? ""}</p>
            </div>
            <div className="chip-row">
              {tags.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </div>
            <p className="discover-card__bio">{profile?.bioShort ?? ""}</p>
          </>
        )}
      </div>
    </article>
  );
}
