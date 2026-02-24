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

const pwaOnboardingRouteMap: Record<OnboardingStep, string> = {
  PHONE_VERIFIED: "/pwa_app/onboarding/video-verification",
  VIDEO_VERIFICATION_PENDING: "/pwa_app/onboarding/video-verification",
  VIDEO_VERIFIED: "/pwa_app/onboarding/payment",
  PAYMENT_PENDING: "/pwa_app/onboarding/payment",
  PAID: "/pwa_app/onboarding/profile",
  PROFILE_PENDING: "/pwa_app/onboarding/profile",
  ACTIVE: "/pwa_app/discover"
};

export function getOnboardingRoute(step?: string | null, isPwa = false) {
  const routeMap = isPwa ? pwaOnboardingRouteMap : onboardingRouteMap;
  if (!step || !(step in routeMap)) {
    return isPwa ? "/pwa_app/onboarding/video-verification" : "/onboarding/video-verification";
  }
  return routeMap[step as OnboardingStep];
}

export function isOnboardingComplete(user: SessionUser | null) {
  return Boolean(user?.onboardingStep === "ACTIVE" && user?.profileCompletedAt);
}

export function getOnboardingStartRoute(isPwa = false): string {
  return getOnboardingRoute("PAID", isPwa);
}

export function getDefaultRoute(user: SessionUser | null): string {
  if (!user?.onboardingStep) return "/login";
  if (!isOnboardingComplete(user)) {
    return getOnboardingRoute(user.onboardingStep, false);
  }
  return "/discover";
}

export function getPwaDefaultRoute(user: SessionUser | null): string {
  if (!user?.onboardingStep) return "/pwa_app/get-started";
  if (!isOnboardingComplete(user)) {
    return getOnboardingRoute(user.onboardingStep, true);
  }
  return "/pwa_app/discover";
}
