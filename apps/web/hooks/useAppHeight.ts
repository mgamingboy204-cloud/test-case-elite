"use client";
import { useEffect } from "react";

export function useAppHeight() {
  useEffect(() => {
    const set = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty("--app-height", `${h}px`);
    };
    set();
    setTimeout(set, 50);
    setTimeout(set, 300);
    setTimeout(set, 600);
    window.visualViewport?.addEventListener("resize", set);
    window.addEventListener("orientationchange", set);
    return () => {
      window.visualViewport?.removeEventListener("resize", set);
      window.removeEventListener("orientationchange", set);
    };
  }, []);
}
