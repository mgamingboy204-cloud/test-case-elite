import { apiFetch } from "@/lib/api";
import { apiEndpoints } from "@/lib/apiEndpoints";
import { computeNextRoute } from "@/lib/onboardingRoute";
import type { SessionUser } from "@/lib/session";

export async function resolvePostAuthRoute(candidateUser?: SessionUser | null) {
  if (candidateUser) {
    return computeNextRoute(candidateUser);
  }

  try {
    const me = await apiFetch(apiEndpoints.me, { retryOnUnauthorized: true });
    return computeNextRoute(me);
  } catch {
    return "/login";
  }
}
