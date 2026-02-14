import { apiFetch } from "@/lib/api";
import { getNextRouteFromStatus } from "@/lib/onboarding";
import type { SessionUser } from "@/lib/session";

export async function resolvePostAuthRoute(candidateUser?: SessionUser | null) {
  if (candidateUser) {
    return getNextRouteFromStatus(candidateUser);
  }

  try {
    const me = await apiFetch<SessionUser>("/me", { retryOnUnauthorized: true });
    return getNextRouteFromStatus(me);
  } catch {
    return "/login";
  }
}
