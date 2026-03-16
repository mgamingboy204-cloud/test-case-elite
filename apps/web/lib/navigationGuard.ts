import type { OnboardingStep } from "@/contexts/AuthContext";
import { routeForOnboardingStep } from "@/contexts/AuthContext";

export type AppStateCode =
  | "guest"
  | "onboarding_required"
  | "verification_required"
  | "payment_required"
  | "profile_incomplete"
  | "matching_ineligible"
  | "profile_data_missing"
  | "eligible";

export function resolveRouteRedirect(options: {
  pathname: string;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  onboardingStep: OnboardingStep;
  scope: "auth" | "onboarding" | "main";
  appStateCode?: AppStateCode | null;
  appStateRedirectTo?: string | null;
}) {
  if (!options.isAuthResolved) return null;

  const appStateCode = options.appStateCode;
  const appStateRedirect = options.appStateRedirectTo;

  if (options.scope === "auth") {
    if (!options.isAuthenticated) return null;
    return routeForOnboardingStep(options.onboardingStep);
  }

  if (!options.isAuthenticated) return "/signin";

  const expected = routeForOnboardingStep(options.onboardingStep);

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
