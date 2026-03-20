import { clearAllCaches } from "@/lib/cache";
import { clearAllAuthStorage } from "@/lib/auth/tokenStorage";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import {
  apiRequestAuth,
  clearAccessToken,
  initializeAccessToken,
  refreshAccessToken,
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
    code: "guest" | "onboarding_required" | "verification_required" | "payment_required" | "profile_incomplete" | "matching_ineligible" | "profile_data_missing" | "eligible";
    redirectTo?: string | null;
    reasons?: string[];
  };
};

export async function bootstrapSession<TUser extends CurrentUser>() {
  initializeAccessToken();

  const refreshStatus = await refreshAccessToken({ allowMissingSession: true });
  if (refreshStatus !== "success") {
    clearAccessToken();
    return null;
  }

  return apiRequestAuth<TUser>(API_ENDPOINTS.user.me);
}

export function clearSessionState() {
  clearAccessToken();
  clearAllCaches();
  clearAllAuthStorage();
}

export function subscribeToSessionInvalidation(listener: () => void) {
  return subscribeToAuthFailure(() => {
    clearSessionState();
    listener();
  });
}

export function isUnauthorizedApiError(error: unknown): error is ApiError {
  return typeof error === "object" && error !== null && "status" in error && Number((error as { status?: unknown }).status) === 401;
}
