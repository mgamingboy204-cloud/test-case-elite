/**
 * API client with built-in token management and refresh logic.
 * This is a thin wrapper around fetch that:
 * - Injects access token in Authorization header
 * - Automatically retries on 401 with token refresh
 * - Handles auth failure notifications
 * - Uses the centralized token service
 */

import {
  getAccessToken,
  setAccessToken as setAccessTokenService,
  clearAccessToken as clearAccessTokenService,
  subscribeToAuthFailure,
  refreshAccessToken as refreshAccessTokenService,
  notifyAuthFailure,
} from "./auth/tokenService";
import { API_BASE_URL } from "./apiBaseUrl";
const apiDebug = process.env.NODE_ENV !== "production";

// Re-export from token service for backwards compatibility
export { subscribeToAuthFailure };
export { API_BASE_URL };

export function setAccessToken(token: string | null) {
  setAccessTokenService(token);
}

export function clearAccessToken() {
  clearAccessTokenService();
}

export async function refreshAccessToken(options?: { allowMissingSession?: boolean }) {
  return refreshAccessTokenService(options);
}

// ============================================================================
// API Error Class
// ============================================================================

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

// ============================================================================
// API Request Implementation
// ============================================================================

export async function apiRequest<T>(
  path: string,
  options?: RequestInit & { auth?: boolean }
) {
  const method = options?.method ?? "GET";
  let didNotifyAuthFailure = false;

  const handleAuthFailure = () => {
    if (didNotifyAuthFailure) return;
    didNotifyAuthFailure = true;
    clearAccessTokenService();
    notifyAuthFailure();
  };

  const runRequest = async () => {
    const headers = new Headers(options?.headers);

    // Get current access token
    if (options?.auth) {
      const token = getAccessToken();
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    // Set default content-type for JSON bodies
    const hasJsonBody =
      options?.body !== undefined && !(options.body instanceof FormData);
    if (hasJsonBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: "include", // Include HttpOnly cookies for refresh token
      });
    } catch (error) {
      if (apiDebug)
        console.error("[api] Network request failed", {
          method,
          path,
          auth: options?.auth ?? false,
          error,
        });
      throw new ApiError(`Network error while calling ${method} ${path}`, 0, {
        cause:
          error instanceof Error ? error.message : String(error),
      });
    }

    // Parse response body
    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    return { response, body };
  };

  let { response, body } = await runRequest();

  // ── AUTH-SPECIFIC HANDLING ──

  // On 401: attempt token refresh if not already an auth endpoint
  if (
    options?.auth &&
    response.status === 401 &&
    !path.startsWith("/auth/")
  ) {
    if (apiDebug)
      console.warn(
        "[api] Received 401 on authenticated request. Attempting token refresh",
        { method, path }
      );

    const refreshStatus = await refreshAccessTokenService();

    if (refreshStatus === "success") {
      if (apiDebug)
        console.info("[api] Refresh succeeded. Retrying request", {
          method,
          path,
        });
      const retry = await runRequest();
      response = retry.response;
      body = retry.body;
    } else {
      handleAuthFailure();
      if (apiDebug)
        console.warn(
          "[api] Refresh failed. Request remains unauthorized",
          { method, path, refreshStatus }
        );
    }
  }

  // On 403: check for auth-related error codes and notify
  if (options?.auth && response.status === 403) {
    const rawCode =
      typeof body === "object" &&
      body !== null &&
      "code" in body
        ? String((body as { code?: string }).code ?? "").toLowerCase()
        : "";
    if (
      rawCode.includes("unauth") ||
      rawCode.includes("token") ||
      rawCode.includes("session")
    ) {
      handleAuthFailure();
      if (apiDebug)
        console.warn("[api] Session revoked (403 with auth error code)", {
          method,
          path,
          code: rawCode,
        });
    }
  }

  if (options?.auth && response.status === 401 && !path.startsWith("/auth/")) {
    handleAuthFailure();
  }

  // ── ERROR HANDLING ──

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body
        ? String((body as { message?: string }).message)
        : `Request failed: ${response.status}`;
    if (apiDebug)
      console.error("[api] Request failed", {
        method,
        path,
        status: response.status,
        body,
      });
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

/**
 * Convenience wrapper for authenticated requests.
 */
export async function apiRequestAuth<T>(
  path: string,
  options?: Omit<RequestInit, "headers"> & { headers?: HeadersInit }
) {
  return apiRequest<T>(path, { ...options, auth: true });
}
