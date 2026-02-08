"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { getAssetUrl } from "../../../lib/assets";
import type { DiscoverProfile } from "../useDiscoverFeed";
import styles from "../discover.module.css";

type QuickProfileSheetProps = {
  isOpen: boolean;
  profile: DiscoverProfile | null;
  onClose: () => void;
};

function formatTag(tag: string) {
  return tag
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildBadges(profile: DiscoverProfile | null) {
  if (!profile) return [];
  const tags: string[] = [];
  if (profile.videoVerificationStatus === "APPROVED") tags.push("Verified");
  if (profile.preferences?.intent) tags.push(formatTag(profile.preferences.intent));
  if (profile.preferences?.distance) tags.push(formatTag(profile.preferences.distance));
  return tags;
}

export default function QuickProfileSheet({ isOpen, profile, onClose }: QuickProfileSheetProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const [sheetOffset, setSheetOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ pointerId: number | null; y: number }>({ pointerId: null, y: 0 });

  const badges = useMemo(() => buildBadges(profile), [profile]);
  const interests = profile?.preferences?.interests ?? [];
  const photoUrl = getAssetUrl(profile?.primaryPhotoUrl);
  const ageValue = typeof profile?.age === "number" ? profile.age : null;

  useEffect(() => {
    if (!isOpen) {
      setSheetOffset(0);
      setIsDragging(false);
      dragStartRef.current = { pointerId: null, y: 0 };
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        "button,[href],input,select,textarea,[tabindex]:not([tabindex='-1'])"
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    dragStartRef.current = { pointerId: event.pointerId, y: event.clientY };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDragging || dragStartRef.current.pointerId !== event.pointerId) return;
    const offset = Math.max(0, event.clientY - dragStartRef.current.y);
    setSheetOffset(offset);
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (dragStartRef.current.pointerId !== event.pointerId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStartRef.current = { pointerId: null, y: 0 };
    setIsDragging(false);
    if (sheetOffset > 120) {
      onClose();
      setSheetOffset(0);
      return;
    }
    setSheetOffset(0);
  }

  if (!profile) return null;

  return (
    <div className={`${styles.quickProfileSheet} ${isOpen ? styles.quickProfileSheetOpen : ""}`}>
      <button
        type="button"
        className={styles.quickProfileBackdrop}
        aria-label="Close profile"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        className={`${styles.quickProfilePanel} ${isDragging ? styles.quickProfilePanelDragging : ""}`}
        role="dialog"
        aria-modal="true"
        style={
          {
            transform: isOpen ? `translateY(${sheetOffset}px)` : "translateY(100%)"
          } as CSSProperties
        }
      >
        <div
          className={styles.quickProfileHandle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          role="presentation"
        >
          <span className={styles.quickProfileHandleBar} />
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.quickProfileClose}
            onClick={onClose}
            aria-label="Close profile"
          >
            ✕
          </button>
        </div>
        <div className={styles.quickProfileContent}>
          <div className={styles.quickProfileHeader}>
            {photoUrl ? (
              <img src={photoUrl} alt={`${profile.name} photo`} />
            ) : (
              <div className={styles.quickProfilePhotoFallback}>{profile.name.slice(0, 1)}</div>
            )}
          </div>
          <div className={styles.quickProfileBody}>
            <h2>
              {profile.name}
              {ageValue !== null ? <span>{ageValue}</span> : null}
            </h2>
            {profile.city ? <p className={styles.quickProfileCity}>{profile.city}</p> : null}
            {badges.length ? (
              <div className={styles.quickProfileBadges}>
                {badges.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>
            ) : null}
            {profile.bioShort ? <p className={styles.quickProfileBio}>{profile.bioShort}</p> : null}
            {interests.length ? (
              <div className={styles.quickProfileSection}>
                <h3>Interests</h3>
                <div className={styles.quickProfileInterests}>
                  {interests.map((interest) => (
                    <span key={interest}>{interest}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
