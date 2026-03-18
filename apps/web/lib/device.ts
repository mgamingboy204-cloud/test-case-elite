export type AppEnvironment = {
  isStandalone: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isIOSPWA: boolean;
  isAndroidPWA: boolean;
};

export function getAppEnvironment(): AppEnvironment {
  if (typeof window === "undefined") {
    return {
      isStandalone: false,
      isIOS: false,
      isAndroid: false,
      isIOSPWA: false,
      isAndroidPWA: false,
    };
  }

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  const ua = navigator.userAgent || navigator.vendor || "";

  const isIOS =
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isAndroid = /Android/.test(ua);

  return {
    isStandalone,
    isIOS,
    isAndroid,
    isIOSPWA: isIOS && isStandalone,
    isAndroidPWA: isAndroid && isStandalone,
  };
}
