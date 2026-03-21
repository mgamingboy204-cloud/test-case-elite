export type BackendOnboardingStep =
  | "PHONE_VERIFIED"
  | "VIDEO_VERIFICATION_PENDING"
  | "VIDEO_VERIFIED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "PROFILE_PENDING"
  | "ACTIVE";

export type BackendOnboardingRedirect =
  | "/discover"
  | "/onboarding/verification"
  | "/onboarding/payment"
  | "/onboarding/details"
  | "/onboarding/photos";

export type VideoVerificationStatus = "NOT_REQUESTED" | "PENDING" | "IN_PROGRESS" | "APPROVED" | "REJECTED";
export type PaymentStatus = "NOT_STARTED" | "PENDING" | "PAID" | "FAILED" | "CANCELED";

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

  const hasValidHeight =
    profile.heightCm == null ||
    (typeof profile.heightCm === "number" && profile.heightCm >= 100 && profile.heightCm <= 250);

  return Boolean(
    profile.name?.trim() &&
      profile.dateOfBirth &&
      profile.gender &&
      profile.city?.trim() &&
      hasValidHeight
  );
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

export function resolveBackendOnboardingRedirect(input: {
  onboardingStep?: string | null;
  videoVerificationStatus?: VideoVerificationStatus | string | null;
  paymentStatus?: PaymentStatus | string | null;
  profileCompletedAt?: Date | string | null;
  subscriptionEndsAt?: Date | string | null;
  photoCount?: number;
}): BackendOnboardingRedirect {
  const resolvedStep = resolveBackendOnboardingStep(input);
  const photoCount = input.photoCount ?? 0;
  const hasCompletedProfile = Boolean(input.profileCompletedAt);

  if (resolvedStep === "ACTIVE") return "/discover";
  if (resolvedStep === "PROFILE_PENDING" || resolvedStep === "PAID") {
    if (hasCompletedProfile && photoCount < 1) return "/onboarding/photos";
    return "/onboarding/details";
  }
  if (resolvedStep === "PAYMENT_PENDING" || resolvedStep === "VIDEO_VERIFIED") {
    return "/onboarding/payment";
  }
  return "/onboarding/verification";
}
