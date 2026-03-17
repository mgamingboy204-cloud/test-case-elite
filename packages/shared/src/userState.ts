import { type BackendOnboardingStep, onboardingRedirectForBackendStep, resolveBackendOnboardingStep } from "./onboarding";

export type UserAppStateCode =
  | "guest"
  | "onboarding_required"
  | "verification_required"
  | "payment_required"
  | "profile_incomplete"
  | "matching_ineligible"
  | "profile_data_missing"
  | "eligible";

export type UserAppState = {
  code: UserAppStateCode;
  isAuthenticated: boolean;
  onboardingStep: BackendOnboardingStep | null;
  matchingEligible: boolean;
  redirectTo: string | null;
  reasons: string[];
};

export function resolveUserAppState(input: {
  isAuthenticated: boolean;
  onboardingStep?: string | null;
  videoVerificationStatus?: string | null;
  paymentStatus?: string | null;
  profileCompletedAt?: Date | string | null;
  subscriptionEndsAt?: Date | string | null;
  photoCount?: number;
  userStatus?: string | null;
  hasProfileRecord?: boolean;
}) : UserAppState {
  if (!input.isAuthenticated) {
    return {
      code: "guest",
      isAuthenticated: false,
      onboardingStep: null,
      matchingEligible: false,
      redirectTo: "/signin",
      reasons: ["unauthenticated"]
    };
  }

  const resolvedOnboardingStep = resolveBackendOnboardingStep({
    onboardingStep: input.onboardingStep,
    videoVerificationStatus: input.videoVerificationStatus,
    paymentStatus: input.paymentStatus,
    profileCompletedAt: input.profileCompletedAt,
    subscriptionEndsAt: input.subscriptionEndsAt,
    photoCount: input.photoCount
  });

  if (resolvedOnboardingStep !== "ACTIVE") {
    const redirectTo = onboardingRedirectForBackendStep(resolvedOnboardingStep);

    if (resolvedOnboardingStep === "VIDEO_VERIFICATION_PENDING" || resolvedOnboardingStep === "PHONE_VERIFIED") {
      return {
        code: "verification_required",
        isAuthenticated: true,
        onboardingStep: resolvedOnboardingStep,
        matchingEligible: false,
        redirectTo,
        reasons: ["verification_required"]
      };
    }

    if (resolvedOnboardingStep === "PAYMENT_PENDING" || resolvedOnboardingStep === "VIDEO_VERIFIED") {
      return {
        code: "payment_required",
        isAuthenticated: true,
        onboardingStep: resolvedOnboardingStep,
        matchingEligible: false,
        redirectTo,
        reasons: ["payment_required"]
      };
    }

    return {
      code: "onboarding_required",
      isAuthenticated: true,
      onboardingStep: resolvedOnboardingStep,
      matchingEligible: false,
      redirectTo,
      reasons: ["onboarding_incomplete"]
    };
  }

  if (input.hasProfileRecord === false) {
    return {
      code: "profile_data_missing",
      isAuthenticated: true,
      onboardingStep: resolvedOnboardingStep,
      matchingEligible: false,
      redirectTo: "/profile",
      reasons: ["profile_record_missing"]
    };
  }

  if (!input.profileCompletedAt || (typeof input.photoCount === "number" && input.photoCount < 1)) {
    return {
      code: "profile_incomplete",
      isAuthenticated: true,
      onboardingStep: resolvedOnboardingStep,
      matchingEligible: false,
      redirectTo: "/onboarding/details",
      reasons: ["profile_incomplete"]
    };
  }

  const eligibilityReasons: string[] = [];

  if (input.userStatus !== "APPROVED") {
    eligibilityReasons.push("account_not_approved");
  }
  if (input.videoVerificationStatus !== "APPROVED") {
    eligibilityReasons.push("video_not_approved");
  }
  if (input.paymentStatus !== "PAID") {
    eligibilityReasons.push("payment_not_paid");
  }

  if (eligibilityReasons.length > 0) {
    return {
      code: "matching_ineligible",
      isAuthenticated: true,
      onboardingStep: resolvedOnboardingStep,
      matchingEligible: false,
      redirectTo: "/profile",
      reasons: eligibilityReasons
    };
  }

  return {
    code: "eligible",
    isAuthenticated: true,
    onboardingStep: resolvedOnboardingStep,
    matchingEligible: true,
    redirectTo: "/discover",
    reasons: []
  };
}
