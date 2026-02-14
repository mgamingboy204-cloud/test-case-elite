"use client";

import type { SessionUser } from "./session";

export type NextRequiredStep =
  | "AUTH_REQUIRED"
  | "VIDEO_VERIFICATION_REQUIRED"
  | "PAYMENT_REQUIRED"
  | "PROFILE_SETUP_REQUIRED"
  | "APP_READY";

const ONBOARDING_VIDEO_ROUTE = "/onboarding/video-verification";
const ONBOARDING_PAYMENT_ROUTE = "/onboarding/payment";
const ONBOARDING_PROFILE_ROUTE = "/onboarding/profile-setup";
const APP_ENTRY_ROUTE = "/app";

export function getNextRequiredStep(status: SessionUser | null): NextRequiredStep {
  if (!status) return "AUTH_REQUIRED";

  const isVideoVerified = status.videoVerificationStatus === "APPROVED";

  if (!isVideoVerified) {
    return "VIDEO_VERIFICATION_REQUIRED";
  }

  if (status.paymentStatus !== "PAID") {
    return "PAYMENT_REQUIRED";
  }

  if (!status.profileCompletedAt) {
    return "PROFILE_SETUP_REQUIRED";
  }

  return "APP_READY";
}

export function getNextRouteFromStatus(status: SessionUser | null): string {
  const nextStep = getNextRequiredStep(status);

  switch (nextStep) {
    case "AUTH_REQUIRED":
      return "/login";
    case "VIDEO_VERIFICATION_REQUIRED":
      return ONBOARDING_VIDEO_ROUTE;
    case "PAYMENT_REQUIRED":
      return ONBOARDING_PAYMENT_ROUTE;
    case "PROFILE_SETUP_REQUIRED":
      return ONBOARDING_PROFILE_ROUTE;
    case "APP_READY":
      return APP_ENTRY_ROUTE;
    default:
      return "/login";
  }
}

export function isOnboardingRoute(pathname: string) {
  return pathname.startsWith("/onboarding");
}

export function isAuthRoute(pathname: string) {
  return pathname === "/login" || pathname === "/signup" || pathname === "/otp";
}

export function isAdminRoute(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isMainAppRoute(pathname: string) {
  return ["/app", "/discover", "/likes", "/matches", "/profile", "/settings", "/refunds", "/report"].some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
