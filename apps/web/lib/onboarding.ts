export type BackendOnboardingStep =
  | "PHONE_VERIFIED"
  | "VIDEO_VERIFICATION_PENDING"
  | "VIDEO_VERIFIED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "PROFILE_PENDING"
  | "ACTIVE";

export type FrontendOnboardingStep =
  | "PHONE"
  | "OTP"
  | "PASSWORD"
  | "VERIFICATION"
  | "PAYMENT"
  | "PROFILE"
  | "PHOTOS"
  | "COMPLETED";

export function routeForFrontendOnboardingStep(step: FrontendOnboardingStep) {
  const routeMap: Record<FrontendOnboardingStep, string> = {
    PHONE: "/signup/phone",
    OTP: "/signup/otp",
    PASSWORD: "/signup/password",
    VERIFICATION: "/onboarding/verification",
    PAYMENT: "/onboarding/payment",
    PROFILE: "/onboarding/profile",
    PHOTOS: "/onboarding/photos",
    COMPLETED: "/discover"
  };

  return routeMap[step];
}

export function resolveFrontendOnboardingStep(input: {
  isAuthenticated: boolean;
  pendingPhone?: string | null;
  signupToken?: string | null;
  backendStep?: BackendOnboardingStep | null;
  profileCompletedAt?: Date | string | null;
  photoCount?: number;
}): FrontendOnboardingStep {
  if (!input.isAuthenticated) {
    if (input.signupToken) return "PASSWORD";
    if (input.pendingPhone) return "OTP";
    return "PHONE";
  }

  const backendStep = input.backendStep;
  // Production gating: main app should only unlock when backend confirms ACTIVE.
  if (backendStep === "ACTIVE") return "COMPLETED";

  if (backendStep === "PAID" || backendStep === "PROFILE_PENDING") {
    // Even if profile/photos look done, keep the user in onboarding until backend marks ACTIVE.
    // This prevents UI showing main app pages that will 403 under API `requireActive`.
    if (input.profileCompletedAt && (input.photoCount ?? 0) >= 1) return "PHOTOS";
    if (input.profileCompletedAt && (input.photoCount ?? 0) < 1) return "PHOTOS";
    return "PROFILE";
  }

  if (backendStep === "PAYMENT_PENDING" || backendStep === "VIDEO_VERIFIED") return "PAYMENT";

  return "VERIFICATION";
}
