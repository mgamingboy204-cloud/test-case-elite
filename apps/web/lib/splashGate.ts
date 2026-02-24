import { resolveNextRoute } from "./onboarding";
import type { SessionStatus, SessionUser } from "./session";

export const SPLASH_MIN_VISIBLE_MS = 700;
export const SPLASH_SOFT_TIMEOUT_MS = 1200;

export function getSplashFallbackRoute(isPwa: boolean) {
  return isPwa ? "/pwa_app/get-started" : "/login";
}

export function resolveSplashDestination(status: SessionStatus, user: SessionUser | null, isPwa: boolean) {
  const fallbackRoute = getSplashFallbackRoute(isPwa);
  if (status !== "logged-in") return fallbackRoute;

  return resolveNextRoute(user, {
    loggedOutRoute: fallbackRoute,
    activeHomeRoute: "/discover"
  });
}

export function warmRouteChunks(route: string) {
  if (route === "/discover") {
    void import("../app/(app)/discover/page");
    return;
  }
  if (route === "/login") {
    void import("../app/(auth)/login/page");
    return;
  }
  if (route === "/pwa_app/get-started") {
    void import("../app/pwa_app/get-started/page");
  }
}
