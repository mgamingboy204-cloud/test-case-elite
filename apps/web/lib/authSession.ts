import { clearAllCaches } from "@/lib/cache";
import { clearAuthFlowStorage } from "@/lib/auth/flowStorage";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  apiRequest,
  clearAccessToken,
  setAccessToken,
  subscribeToAuthFailure,
  type ApiError
} from "@/lib/api";

export type CurrentUser = {
  id: string;
  phone: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  onboardingStep: string;
  profileCompletedAt?: string | null;
  photoCount?: number;
  onboardingToken?: string | null;
  appState?: {
    code: "guest" | "onboarding_required" | "verification_required" | "payment_required" | "profile_incomplete" | "matching_ineligible" | "eligible";
    redirectTo?: string | null;
    reasons?: string[];
  };
};

export async function bootstrapSession<TUser extends CurrentUser>() {
  const session = await apiRequest<
    | { ok: true; authenticated: false; reason?: string | null }
    | { ok: true; authenticated: true; accessToken: string; user: TUser }
  >(API_ENDPOINTS.auth.session.bootstrap, {
    method: "POST",
    body: JSON.stringify({})
  });

  if (!session.authenticated) {
    clearAccessToken();
    return null;
  }

  setAccessToken(session.accessToken);
  return session.user;
}

export function clearMemberSessionState() {
  clearAccessToken();
  clearAllCaches();
}

export function clearClientAuthState() {
  clearMemberSessionState();
  clearAuthFlowStorage();
}

export function subscribeToSessionInvalidation(listener: () => void) {
  return subscribeToAuthFailure(() => {
    clearMemberSessionState();
    listener();
  });
}

export function isUnauthorizedApiError(error: unknown): error is ApiError {
  return typeof error === "object" && error !== null && "status" in error && Number((error as { status?: unknown }).status) === 401;
}
