import { routeForFrontendOnboardingStep, type FrontendOnboardingStep } from "@/lib/onboarding";
import type { AuthFlowMode } from "@/lib/auth/flowStorage";

export type AppStateCode =
  | "guest"
  | "onboarding_required"
  | "verification_required"
  | "payment_required"
  | "profile_incomplete"
  | "matching_ineligible"
  | "profile_data_missing"
  | "eligible";

export function resolvePendingAuthRoute(options: {
  authFlowMode?: AuthFlowMode | null;
  pendingPhone?: string | null;
  signupToken?: string | null;
}) {
  if (options.authFlowMode === "signup") {
    if (options.signupToken) return "/signup/password";
    if (options.pendingPhone) return "/signup/otp";
    return "/signup/phone";
  }

  if (options.authFlowMode === "signin" && options.pendingPhone) {
    return "/signin/otp";
  }

  return null;
}

export function resolveRouteRedirect(options: {
  pathname: string;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  onboardingStep: FrontendOnboardingStep;
  scope: "auth" | "onboarding" | "main";
  userRole?: "USER" | "EMPLOYEE" | "ADMIN" | null;
  appStateCode?: AppStateCode | null;
  appStateRedirectTo?: string | null;
  authFlowMode?: AuthFlowMode | null;
  pendingPhone?: string | null;
  signupToken?: string | null;
}) {
  if (!options.isAuthResolved) return null;

  const appStateCode = options.appStateCode;
  const appStateRedirect = options.appStateRedirectTo;
  const defaultAuthenticatedRoute =
    options.userRole === "EMPLOYEE" || options.userRole === "ADMIN"
      ? "/employee/verification"
      : routeForFrontendOnboardingStep(options.onboardingStep);

  if (options.scope === "auth") {
    if (!options.isAuthenticated) {
      const pendingAuthRoute = resolvePendingAuthRoute({
        authFlowMode: options.authFlowMode,
        pendingPhone: options.pendingPhone,
        signupToken: options.signupToken
      });
      if (pendingAuthRoute && options.pathname !== pendingAuthRoute) {
        return pendingAuthRoute;
      }
      return null;
    }
    return defaultAuthenticatedRoute;
  }

  if (!options.isAuthenticated) return "/signin";
  if (options.userRole === "EMPLOYEE" || options.userRole === "ADMIN") {
    return defaultAuthenticatedRoute;
  }

  const expected = routeForFrontendOnboardingStep(options.onboardingStep);

  if (options.scope === "onboarding") {
    if (options.onboardingStep === "COMPLETED") return "/discover";
    return options.pathname === expected ? null : expected;
  }

  if (options.onboardingStep !== "COMPLETED") return expected;

  if (appStateCode === "matching_ineligible" || appStateCode === "profile_data_missing" || appStateCode === "profile_incomplete") {
    const target = appStateRedirect ?? "/profile";
    if (options.pathname !== target && (options.pathname === "/discover" || options.pathname === "/likes" || options.pathname === "/matches")) {
      return target;
    }
  }

  return null;
}
