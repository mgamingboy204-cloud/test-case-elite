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
    PROFILE: "/onboarding/details",
    PHOTOS: "/onboarding/photos",
    COMPLETED: "/discover"
  };

  return routeMap[step];
}

function resolveRouteFromAuthenticatedMemberState(input: {
  backendStep?: BackendOnboardingStep | null;
  redirectTo?: string | null;
  appState?: { redirectTo?: string | null } | null;
}) {
  const explicitRedirect = (
    input.appState?.redirectTo ??
    input.redirectTo ??
    ""
  ).trim();
  if (explicitRedirect.startsWith("/")) {
    return explicitRedirect;
  }

  const backendStep = input.backendStep;
  if (backendStep === "ACTIVE") return "/discover";
  if (backendStep === "PAYMENT_PENDING" || backendStep === "VIDEO_VERIFIED") {
    return "/onboarding/payment";
  }
  if (backendStep === "PAID" || backendStep === "PROFILE_PENDING") {
    return "/onboarding/details";
  }
  return "/onboarding/verification";
}

export function routeForAuthenticatedUser(input: {
  role?: "USER" | "EMPLOYEE" | "ADMIN" | null;
  mustResetPassword?: boolean;
  backendStep?: BackendOnboardingStep | null;
  onboardingStep?: BackendOnboardingStep | null;
  profileCompletedAt?: Date | string | null;
  photoCount?: number;
  redirectTo?: string | null;
  appState?: { redirectTo?: string | null } | null;
}) {
  if (input.role === "EMPLOYEE" || input.role === "ADMIN") {
    if (input.mustResetPassword) {
      return "/staff/password-reset";
    }
    return input.role === "ADMIN" ? "/admin" : "/employee";
  }

  return resolveRouteFromAuthenticatedMemberState({
    backendStep: input.backendStep ?? input.onboardingStep,
    redirectTo: input.redirectTo,
    appState: input.appState
  });
}

export function resolveFrontendOnboardingStep(input: {
  isAuthenticated: boolean;
  pendingPhone?: string | null;
  signupToken?: string | null;
  authenticatedRoute?: string | null;
  backendStep?: BackendOnboardingStep | null;
}): FrontendOnboardingStep {
  if (!input.isAuthenticated) {
    if (input.signupToken) return "PASSWORD";
    if (input.pendingPhone) return "OTP";
    return "PHONE";
  }

  const authenticatedRoute = (
    input.authenticatedRoute ??
    resolveRouteFromAuthenticatedMemberState({
      backendStep: input.backendStep
    })
  ).trim();

  if (authenticatedRoute.startsWith("/onboarding/photos")) return "PHOTOS";
  if (authenticatedRoute.startsWith("/onboarding/details")) return "PROFILE";
  if (authenticatedRoute.startsWith("/onboarding/payment")) return "PAYMENT";
  if (authenticatedRoute.startsWith("/onboarding/verification")) return "VERIFICATION";
  return "COMPLETED";
}
