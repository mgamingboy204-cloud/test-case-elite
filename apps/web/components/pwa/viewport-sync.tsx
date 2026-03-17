"use client";

import { useEffect } from "react";

const FALLBACK_VH = "100dvh";
const ORIENTATION_SYNC_DELAYS_MS = [120, 320, 700];

function getViewportHeight() {
  if (typeof window === "undefined") return null;
  const visualHeight = window.visualViewport?.height;
  const innerHeight = window.innerHeight;
  const clientHeight = document.documentElement.clientHeight;
  const nextHeight = Math.max(visualHeight ?? 0, innerHeight, clientHeight);
  return Number.isFinite(nextHeight) ? nextHeight : null;
}

export function ViewportSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    const applyHeight = () => {
      const height = getViewportHeight();
      if (!height) {
        root.style.setProperty("--app-height", FALLBACK_VH);
        return;
      }
      root.style.setProperty("--app-height", `${height}px`);
    };

    const applyWithDelay = () => {
      applyHeight();
      window.requestAnimationFrame(() => applyHeight());
      window.setTimeout(applyHeight, 120);
      window.setTimeout(applyHeight, 320);
    };

    const applyOrientationSync = () => {
      applyHeight();
      ORIENTATION_SYNC_DELAYS_MS.forEach((delay) => {
        window.setTimeout(applyHeight, delay);
      });
    };

    applyWithDelay();

    const onResize = () => applyWithDelay();
    const onOrientation = () => applyOrientationSync();
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        applyWithDelay();
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    window.addEventListener("load", onResize);
    window.addEventListener("pageshow", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("load", onResize);
      window.removeEventListener("pageshow", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}
