import { apiFetch } from "@/lib/api";
import { computeNextOnboardingRoute } from "@/lib/onboardingRoute";
import type { SessionUser } from "@/lib/session";

export async function resolvePostAuthRoute(candidateUser?: SessionUser | null) {
  if (candidateUser) {
    return computeNextOnboardingRoute(candidateUser);
  }

  try {
    const me = await apiFetch<SessionUser>("/me", { retryOnUnauthorized: true });
    return computeNextOnboardingRoute(me);
  } catch {
    return "/login";
  }
}
