import type { OnboardingStep } from "@/contexts/AuthContext";
import { routeForOnboardingStep } from "@/contexts/AuthContext";

export function resolveRouteRedirect(options: {
  pathname: string;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  onboardingStep: OnboardingStep;
  scope: "auth" | "onboarding" | "main";
}) {
  if (!options.isAuthResolved) return null;

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
  return null;
}
