"use client";

type StandaloneDetectorDeps = {
  matchMediaStandalone: boolean;
  iosStandalone: boolean;
};

export function isStandaloneFromDeps({ matchMediaStandalone, iosStandalone }: StandaloneDetectorDeps) {
  return matchMediaStandalone || iosStandalone;
}

export function isStandaloneDisplayMode() {
  if (typeof window === "undefined") return false;
  return isStandaloneFromDeps({
    matchMediaStandalone: window.matchMedia("(display-mode: standalone)").matches,
    iosStandalone: (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  });
}
