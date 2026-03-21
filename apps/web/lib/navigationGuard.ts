import { routeForFrontendOnboardingStep, type FrontendOnboardingStep } from "@/lib/onboarding";
import type { AuthFlowMode } from "@/lib/auth/flowStorage";

export type AppStateCode =
  | "guest"
  | "onboarding_required"
  | "verification_required"
  | "payment_required"
  | "profile_incomplete"
  | "matching_ineligible"
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
  onboardingStep?: FrontendOnboardingStep;
  authenticatedRoute?: string | null;
  scope: "auth" | "onboarding" | "main";
  userRole?: "USER" | "EMPLOYEE" | "ADMIN" | null;
  mustResetPassword?: boolean;
  authFlowMode?: AuthFlowMode | null;
  pendingPhone?: string | null;
  signupToken?: string | null;
}) {
  if (!options.isAuthResolved) return null;

  const defaultAuthenticatedRoute =
    options.authenticatedRoute ??
    ((options.userRole === "ADMIN" || options.userRole === "EMPLOYEE") && options.mustResetPassword
      ? "/staff/password-reset"
      : options.userRole === "ADMIN"
      ? "/admin"
      : options.userRole === "EMPLOYEE"
        ? "/employee"
      : routeForFrontendOnboardingStep(options.onboardingStep ?? "COMPLETED"));

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

  const expected = defaultAuthenticatedRoute;
  const isOnboardingRoute = expected.startsWith("/onboarding/");

  if (options.scope === "onboarding") {
    if (!isOnboardingRoute) return expected;
    return options.pathname === expected ? null : expected;
  }

  if (isOnboardingRoute) return expected;

  if (expected === "/profile") {
    const isRestrictedMainRoute =
      options.pathname === "/discover" ||
      options.pathname === "/likes" ||
      options.pathname === "/matches";
    if (isRestrictedMainRoute) return expected;
  }

  return null;
}
