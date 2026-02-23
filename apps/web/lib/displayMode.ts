export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;

  const mediaQueryStandalone = window.matchMedia?.("(display-mode: standalone)").matches ?? false;
  const iosStandalone = window.navigator && "standalone" in window.navigator
    ? (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    : false;

  return mediaQueryStandalone || iosStandalone;
}
