"use client";

import { useEffect } from "react";

const FALLBACK_VH = "100dvh";

function getViewportHeight() {
  if (typeof window === "undefined") return null;
  const visualHeight = window.visualViewport?.height;
  const innerHeight = window.innerHeight;
  const nextHeight = Math.min(visualHeight ?? innerHeight, innerHeight);
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
      window.setTimeout(applyHeight, 120);
      window.setTimeout(applyHeight, 320);
    };

    applyWithDelay();

    const onResize = () => applyWithDelay();
    const onOrientation = () => applyWithDelay();

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onOrientation);
    window.addEventListener("pageshow", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("scroll", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("pageshow", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
    };
  }, []);

  return null;
}
