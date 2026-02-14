import { apiFetch } from "@/lib/api";
import { computeNextRoute } from "@/lib/onboardingRoute";
import type { SessionUser } from "@/lib/session";

export async function resolvePostAuthRoute(candidateUser?: SessionUser | null) {
  if (candidateUser) {
    return computeNextRoute(candidateUser);
  }

  try {
    const me = await apiFetch<SessionUser>("/me", { retryOnUnauthorized: true });
    return computeNextRoute(me);
  } catch {
    return "/login";
  }
}
