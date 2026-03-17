"use client";

import { useEffect } from "react";

export function useAppHeight() {
  useEffect(() => {
    const setHeight = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${h}px`);
    };

    setHeight();
    setTimeout(setHeight, 100); // iOS PWA cold launch safety
    setTimeout(setHeight, 500); // double safety net

    window.visualViewport?.addEventListener("resize", setHeight);
    window.addEventListener("orientationchange", setHeight);
    window.addEventListener("resize", setHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", setHeight);
      window.removeEventListener("orientationchange", setHeight);
      window.removeEventListener("resize", setHeight);
    };
  }, []);
}
