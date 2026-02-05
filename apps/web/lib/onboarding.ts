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

export function getDefaultRoute(user: SessionUser | null) {
  if (!user?.onboardingStep) return "/login";
  if (user.onboardingStep === "ACTIVE" && !user.profileCompletedAt) {
    return "/onboarding/profile";
  }
  if (user.onboardingStep === "ACTIVE") {
    return "/discover";
  }
  return getOnboardingRoute(user.onboardingStep);
}
