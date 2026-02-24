"use client";

import { SessionUser } from "./session";

export type OnboardingStep =
  | "PHONE_VERIFIED"
  | "VIDEO_VERIFICATION_PENDING"
  | "VIDEO_VERIFIED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "PROFILE_PENDING"
  | "ACTIVE";

const onboardingRouteMap: Record<OnboardingStep, string> = {
  PHONE_VERIFIED: "/onboarding/video-verification",
  VIDEO_VERIFICATION_PENDING: "/onboarding/video-verification",
  VIDEO_VERIFIED: "/onboarding/payment",
  PAYMENT_PENDING: "/onboarding/payment",
  PAID: "/onboarding/profile",
  PROFILE_PENDING: "/onboarding/profile",
  ACTIVE: "/discover"
};

export function getOnboardingRoute(step?: string | null) {
  if (!step || !(step in onboardingRouteMap)) {
    return "/onboarding/video-verification";
  }
  return onboardingRouteMap[step as OnboardingStep];
}

type ResolveNextRouteOptions = {
  loggedOutRoute?: string;
  activeHomeRoute?: string;
};

export function resolveNextRoute(user: SessionUser | null, options: ResolveNextRouteOptions = {}) {
  const {
    loggedOutRoute = "/login",
    activeHomeRoute = "/discover"
  } = options;

  if (!user?.onboardingStep) return loggedOutRoute;

  if (user.onboardingStep === "ACTIVE" && !user.profileCompletedAt) {
    return "/onboarding/profile";
  }

  if (user.onboardingStep === "ACTIVE") {
    return activeHomeRoute;
  }

  return getOnboardingRoute(user.onboardingStep);
}

export function getDefaultRoute(user: SessionUser | null) {
  return resolveNextRoute(user, { loggedOutRoute: "/login" });
}

export function getPwaDefaultRoute(user: SessionUser | null) {
  return resolveNextRoute(user, { loggedOutRoute: "/pwa_app/get-started" });
}
