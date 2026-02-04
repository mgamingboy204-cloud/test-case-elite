"use client";

import RouteGuard from "../components/RouteGuard";

const onboardingSteps = [
  "PHONE_VERIFIED",
  "VIDEO_VERIFICATION_PENDING",
  "VIDEO_VERIFIED",
  "PAYMENT_PENDING",
  "PAID",
  "PROFILE_PENDING"
];

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedOnboardingSteps={onboardingSteps}>{children}</RouteGuard>;
}
