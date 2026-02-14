import type { SessionUser } from "@/lib/session";

const VIDEO_ROUTE = "/onboarding/video-verification";
const PAYMENT_ROUTE = "/onboarding/payment";
const PROFILE_ROUTE = "/onboarding/profile-setup";
const APP_ROUTE = "/app";

const CANONICAL_ROUTE_MAP: Record<string, string> = {
  "/onboarding/profile": PROFILE_ROUTE,
  "/onboarding/profile-setup": PROFILE_ROUTE,
  "/onboarding/video-verification": VIDEO_ROUTE,
  "/onboarding/payment": PAYMENT_ROUTE,
  "/app": APP_ROUTE,
};

function canonicalizeRoute(route?: string | null) {
  if (!route) return null;
  return CANONICAL_ROUTE_MAP[route] ?? route;
}

function isVideoVerified(user: SessionUser) {
  return user.videoVerificationStatus === "APPROVED";
}

export function computeNextRoute(user: SessionUser | null): string {
  if (!user) return "/login";

  const backendRoute = canonicalizeRoute(user.onboardingStatus?.nextRoute);
  if (backendRoute) {
    return backendRoute;
  }

  if (!isVideoVerified(user)) {
    return VIDEO_ROUTE;
  }

  if (user.paymentStatus !== "PAID") {
    return PAYMENT_ROUTE;
  }

  if (!user.profileCompletedAt) {
    return PROFILE_ROUTE;
  }

  return APP_ROUTE;
}

export function isAppReady(user: SessionUser | null) {
  return computeNextRoute(user) === APP_ROUTE;
}
