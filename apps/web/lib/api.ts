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
  initializeAccessToken as initializeAccessTokenService,
  subscribeToAuthFailure,
  refreshAccessToken as refreshAccessTokenService,
} from "./auth/tokenService";

function resolveApiBaseUrl() {
  const configured = (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
  ).trim();
  const fallback = "http://localhost:4000";
  const baseUrl = (configured || fallback).replace(/\/$/, "");

  // During `next build`, Next may evaluate this module with `NODE_ENV=production`.
  // Avoid hard-crashing builds for local/dev environments that accidentally point to localhost.
  // We still enforce the rule on real Vercel deployments.
  if (
    process.env.NODE_ENV === "production" &&
    (process.env.VERCEL === "1" || Boolean(process.env.VERCEL_URL)) &&
    /localhost|127\.0\.0\.1/.test(baseUrl)
  ) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must not point to localhost in production.");
  }

  return baseUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();
const apiDebug = process.env.NODE_ENV !== "production";

// Re-export from token service for backwards compatibility
export { subscribeToAuthFailure };

export function initializeAccessToken() {
  initializeAccessTokenService();
}

export function setAccessToken(token: string | null) {
  setAccessTokenService(token);
}

export function clearAccessToken() {
  clearAccessTokenService();
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
      clearAccessTokenService();
      subscribeToAuthFailure; // Re-export, but we also call notify via tokenService
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
      clearAccessTokenService();
      if (apiDebug)
        console.warn("[api] Session revoked (403 with auth error code)", {
          method,
          path,
          code: rawCode,
        });
    }
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
