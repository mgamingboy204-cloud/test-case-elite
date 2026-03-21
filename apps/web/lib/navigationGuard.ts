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

const ELIGIBLE_MEMBER_MAIN_ROUTES = [
  "/discover",
  "/likes",
  "/matches",
  "/alerts",
  "/profile",
  "/renew",
  "/settings"
] as const;

const LIMITED_MEMBER_MAIN_ROUTES = [
  "/alerts",
  "/profile",
  "/renew",
  "/settings"
] as const;

function isSameRouteOrChild(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isOnboardingRoute(pathname: string) {
  return pathname.startsWith("/onboarding/");
}

function matchesAnyRoute(pathname: string, routes: readonly string[]) {
  return routes.some((route) => isSameRouteOrChild(pathname, route));
}

function resolveDefaultAuthenticatedRoute(options: {
  authenticatedRoute?: string | null;
  onboardingStep?: FrontendOnboardingStep;
  userRole?: "USER" | "EMPLOYEE" | "ADMIN" | null;
  mustResetPassword?: boolean;
  appStateRedirectTo?: string | null;
}) {
  if (options.authenticatedRoute?.startsWith("/")) {
    return options.authenticatedRoute;
  }

  if ((options.userRole === "ADMIN" || options.userRole === "EMPLOYEE") && options.mustResetPassword) {
    return "/staff/password-reset";
  }

  if (options.userRole === "ADMIN") return "/admin";
  if (options.userRole === "EMPLOYEE") return "/employee";

  if (options.appStateRedirectTo?.startsWith("/")) {
    return options.appStateRedirectTo;
  }

  return routeForFrontendOnboardingStep(options.onboardingStep ?? "COMPLETED");
}

export function isEligibleMemberAppState(code?: AppStateCode | null) {
  return code === "eligible";
}

export function hasMemberMainShellAccess(code?: AppStateCode | null) {
  return code === "eligible" || code === "matching_ineligible";
}

export function canAccessMemberMainRoute(pathname: string, code?: AppStateCode | null) {
  if (!hasMemberMainShellAccess(code)) return false;

  const allowedRoutes =
    code === "eligible" ? ELIGIBLE_MEMBER_MAIN_ROUTES : LIMITED_MEMBER_MAIN_ROUTES;

  return matchesAnyRoute(pathname, allowedRoutes);
}

export function canShowMemberNavRoute(href: string, code?: AppStateCode | null) {
  return canAccessMemberMainRoute(href, code);
}

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
  appStateCode?: AppStateCode | null;
  appStateRedirectTo?: string | null;
  scope: "auth" | "onboarding" | "main";
  userRole?: "USER" | "EMPLOYEE" | "ADMIN" | null;
  mustResetPassword?: boolean;
  authFlowMode?: AuthFlowMode | null;
  pendingPhone?: string | null;
  signupToken?: string | null;
}) {
  if (!options.isAuthResolved) return null;

  const defaultAuthenticatedRoute = resolveDefaultAuthenticatedRoute({
    authenticatedRoute: options.authenticatedRoute,
    onboardingStep: options.onboardingStep,
    userRole: options.userRole,
    mustResetPassword: options.mustResetPassword,
    appStateRedirectTo: options.appStateRedirectTo
  });

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
    return options.pathname === defaultAuthenticatedRoute ? null : defaultAuthenticatedRoute;
  }

  if (options.scope === "onboarding") {
    return options.pathname === defaultAuthenticatedRoute ? null : defaultAuthenticatedRoute;
  }

  if (isOnboardingRoute(defaultAuthenticatedRoute)) {
    return options.pathname === defaultAuthenticatedRoute ? null : defaultAuthenticatedRoute;
  }

  if (!hasMemberMainShellAccess(options.appStateCode)) {
    return options.pathname === defaultAuthenticatedRoute ? null : defaultAuthenticatedRoute;
  }

  if (!canAccessMemberMainRoute(options.pathname, options.appStateCode)) {
    return defaultAuthenticatedRoute;
  }

  return null;
}
