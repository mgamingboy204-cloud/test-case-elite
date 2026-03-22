import {
  routeForAuthenticatedMember,
  type BackendOnboardingStep,
} from "@/lib/onboarding";
import {
  resolveStaffLandingRoute,
  type SessionRole,
} from "@/lib/staffNavigation";

export function routeForAuthenticatedSession(input: {
  role?: SessionRole | null;
  mustResetPassword?: boolean | null;
  backendStep?: BackendOnboardingStep | null;
  onboardingStep?: BackendOnboardingStep | null;
  redirectTo?: string | null;
  appState?: { redirectTo?: string | null } | null;
}) {
  const staffRoute = resolveStaffLandingRoute({
    role: input.role,
    mustResetPassword: input.mustResetPassword,
  });

  if (staffRoute) {
    return staffRoute;
  }

  return routeForAuthenticatedMember({
    backendStep: input.backendStep ?? input.onboardingStep,
    redirectTo: input.redirectTo,
    appState: input.appState,
  });
}
