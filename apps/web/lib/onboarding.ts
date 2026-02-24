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
  PHONE_VERIFIED: "/verification/video",
  VIDEO_VERIFICATION_PENDING: "/verification/video",
  VIDEO_VERIFIED: "/payment",
  PAYMENT_PENDING: "/payment",
  PAID: "/onboarding",
  PROFILE_PENDING: "/onboarding",
  ACTIVE: "/app"
};

export function getOnboardingRoute(step?: string | null) {
  if (!step || !(step in onboardingRouteMap)) {
    return "/auth/otp";
  }
  return onboardingRouteMap[step as OnboardingStep];
}

export function getDefaultRoute(user: SessionUser | null) {
  if (!user?.onboardingStep) return "/get-started";
  if (user.onboardingStep === "ACTIVE" && !user.profileCompletedAt) {
    return "/onboarding";
  }
  if (user.onboardingStep === "ACTIVE") {
    return "/app";
  }
  return getOnboardingRoute(user.onboardingStep);
}
