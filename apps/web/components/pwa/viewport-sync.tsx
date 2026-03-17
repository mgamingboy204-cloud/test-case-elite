"use client";

import { useEffect } from "react";

const FALLBACK_VH = "100dvh";
const ORIENTATION_SYNC_DELAYS_MS = [120, 320, 700];

function isIosWebKit() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isiOSDevice = /iP(ad|hone|od)/.test(ua);
  const isWebKit = /WebKit/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isiOSDevice && isWebKit;
}

function getStableViewportHeight(useIosMode: boolean) {
  if (typeof window === "undefined") return null;

  const innerHeight = window.innerHeight;
  const clientHeight = document.documentElement.clientHeight;

  if (useIosMode) {
    if (!Number.isFinite(innerHeight) || innerHeight <= 0) return null;
    return innerHeight;
  }

  const visualHeight = window.visualViewport?.height;
  const nextHeight = Math.max(visualHeight ?? 0, innerHeight, clientHeight);
  return Number.isFinite(nextHeight) ? nextHeight : null;
}

export function ViewportSync() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const useIosMode = isIosWebKit();
    const isStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    let lastHeight = 0;

    if (useIosMode) {
      root.dataset.iosViewportMode = isStandalone ? "standalone" : "safari";
    }

    const applyHeight = () => {
      const height = getStableViewportHeight(useIosMode);
      if (!height) {
        root.style.setProperty("--app-height", FALLBACK_VH);
        return;
      }

      if (Math.abs(height - lastHeight) < 1) return;
      lastHeight = height;
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

    if (!useIosMode) {
      window.visualViewport?.addEventListener("resize", onResize);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener("load", onResize);
      window.removeEventListener("pageshow", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      if (!useIosMode) {
        window.visualViewport?.removeEventListener("resize", onResize);
      }
      if (useIosMode) {
        delete root.dataset.iosViewportMode;
      }
    };
  }, []);

  return null;
}
