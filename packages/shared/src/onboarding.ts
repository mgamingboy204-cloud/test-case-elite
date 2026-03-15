export type BackendOnboardingStep =
  | "PHONE_VERIFIED"
  | "VIDEO_VERIFICATION_PENDING"
  | "VIDEO_VERIFIED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "PROFILE_PENDING"
  | "ACTIVE";

export type VideoVerificationStatus = "NOT_REQUESTED" | "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED";
export type PaymentStatus = "NOT_STARTED" | "PENDING" | "PAID" | "FAILED" | "CANCELED";

export type FrontendOnboardingStep =
  | "PHONE"
  | "OTP"
  | "PASSWORD"
  | "VERIFICATION"
  | "PAYMENT"
  | "PROFILE"
  | "PHOTOS"
  | "COMPLETED";

export type OnboardingProfileSnapshot = {
  name?: string | null;
  dateOfBirth?: Date | string | null;
  gender?: string | null;
  heightCm?: number | null;
  profession?: string | null;
  city?: string | null;
  bioShort?: string | null;
};

export function hasRequiredOnboardingProfile(profile?: OnboardingProfileSnapshot | null) {
  if (!profile) return false;

  return Boolean(
    profile.name?.trim() &&
      profile.dateOfBirth &&
      profile.gender &&
      typeof profile.heightCm === "number" &&
      profile.heightCm >= 120 &&
      profile.heightCm <= 240 &&
      profile.profession?.trim() &&
      profile.city?.trim() &&
      profile.bioShort?.trim()
  );
}

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

export function resolveBackendOnboardingStep(input: {
  onboardingStep?: string | null;
  videoVerificationStatus?: VideoVerificationStatus | string | null;
  paymentStatus?: PaymentStatus | string | null;
  profileCompletedAt?: Date | string | null;
  subscriptionEndsAt?: Date | string | null;
  photoCount?: number;
}): BackendOnboardingStep {
  const photoCount = input.photoCount ?? 0;
  const hasActiveSubscription =
    input.paymentStatus === "PAID" &&
    (!input.subscriptionEndsAt || new Date(input.subscriptionEndsAt).getTime() > Date.now());

  if (input.onboardingStep === "ACTIVE" && photoCount > 0 && hasActiveSubscription) return "ACTIVE";
  if (input.profileCompletedAt && photoCount > 0 && hasActiveSubscription) return "ACTIVE";
  if (hasActiveSubscription) return "PROFILE_PENDING";
  if (input.paymentStatus === "PENDING") return "PAYMENT_PENDING";
  if (input.paymentStatus === "FAILED" || input.paymentStatus === "CANCELED") return "PAYMENT_PENDING";
  if (input.videoVerificationStatus === "APPROVED") return "VIDEO_VERIFIED";
  if (input.videoVerificationStatus === "IN_PROGRESS" || input.videoVerificationStatus === "PENDING") {
    return "VIDEO_VERIFICATION_PENDING";
  }
  return "PHONE_VERIFIED";
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
  if (backendStep === "ACTIVE") return "COMPLETED";

  if (backendStep === "PAID" || backendStep === "PROFILE_PENDING") {
    if (input.profileCompletedAt && (input.photoCount ?? 0) >= 1) return "COMPLETED";
    if (input.profileCompletedAt && (input.photoCount ?? 0) < 1) return "PHOTOS";
    return "PROFILE";
  }

  if (backendStep === "PAYMENT_PENDING" || backendStep === "VIDEO_VERIFIED") return "PAYMENT";

  return "VERIFICATION";
}

export function onboardingRedirectForBackendStep(step: BackendOnboardingStep) {
  if (step === "ACTIVE") return routeForFrontendOnboardingStep("COMPLETED");
  if (step === "PAID" || step === "PROFILE_PENDING") return routeForFrontendOnboardingStep("PROFILE");
  if (step === "PAYMENT_PENDING" || step === "VIDEO_VERIFIED") return routeForFrontendOnboardingStep("PAYMENT");
  return routeForFrontendOnboardingStep("VERIFICATION");
}
