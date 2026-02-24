import { SessionUser } from "./session";

export const FUNNEL_ROUTES = {
  getStarted: "/get-started",
  authSignup: "/auth/signup",
  authPhone: "/auth/phone",
  authOtp: "/auth/otp",
  videoVerification: "/verification/video",
  payment: "/payment",
  onboarding: "/onboarding",
  app: "/app"
} as const;

export function routeForOnboardingStep(step?: string | null) {
  switch (step) {
    case "VIDEO_VERIFICATION_PENDING":
    case "PHONE_VERIFIED":
      return FUNNEL_ROUTES.videoVerification;
    case "VIDEO_VERIFIED":
    case "PAYMENT_PENDING":
      return FUNNEL_ROUTES.payment;
    case "PAID":
    case "PROFILE_PENDING":
      return FUNNEL_ROUTES.onboarding;
    case "ACTIVE":
      return FUNNEL_ROUTES.app;
    default:
      return FUNNEL_ROUTES.authOtp;
  }
}

export function nextRequiredRoute(user: SessionUser | null) {
  if (!user) return FUNNEL_ROUTES.getStarted;
  if (!user.phoneVerifiedAt) return FUNNEL_ROUTES.authOtp;
  if (user.videoVerificationStatus !== "APPROVED") return FUNNEL_ROUTES.videoVerification;
  if (user.paymentStatus !== "PAID") return FUNNEL_ROUTES.payment;
  if (!user.profileCompletedAt) return FUNNEL_ROUTES.onboarding;
  return FUNNEL_ROUTES.app;
}

export function isAppRoute(pathname: string | null) {
  return Boolean(pathname && (pathname === "/app" || pathname.startsWith("/discover") || pathname.startsWith("/matches") || pathname.startsWith("/likes") || pathname.startsWith("/profile") || pathname.startsWith("/settings") || pathname.startsWith("/refunds") || pathname.startsWith("/report")));
}
