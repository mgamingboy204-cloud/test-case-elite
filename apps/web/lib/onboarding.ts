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

export function isOnboardingComplete(user: SessionUser | null) {
  return Boolean(user?.onboardingStep === "ACTIVE" && user?.profileCompletedAt);
}

export function getOnboardingStartRoute(isPwa = false): string {
  return isPwa ? "/pwa_app/onboarding/profile" : "/onboarding/profile";
}

export function getDefaultRoute(user: SessionUser | null): string {
  if (!user?.onboardingStep) return "/login";
  if (!isOnboardingComplete(user)) {
    return getOnboardingStartRoute(false);
  }
  return "/discover";
}

export function getPwaDefaultRoute(user: SessionUser | null): string {
  if (!user?.onboardingStep) return "/pwa_app/get-started";
  if (!isOnboardingComplete(user)) {
    return getOnboardingStartRoute(true);
  }
  return "/pwa_app/discover";
}
