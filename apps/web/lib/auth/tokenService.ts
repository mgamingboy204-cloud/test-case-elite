/**
 * Token service.
 * Manages the complete token lifecycle:
 * - In-memory caching
 * - Storage persistence
 * - Expiry validation
 * - Refresh logic (isolated and composable)
 * - Auth state notifications
 */

import {
  readStoredAccessToken,
  writeStoredAccessToken,
  clearAllAuthStorage,
} from "./tokenStorage";

const API_BASE_URL = (() => {
  const configured = (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
  ).trim();
  return (configured || "http://localhost:4000").replace(/\/$/, "");
})();

const DEBUG = process.env.NODE_ENV !== "production";

/** In-memory access token cache */
let accessToken: string | null = null;

/** Tracks generation to prevent stale token reuse after logout */
let authGeneration = 0;

/** Listeners for auth failure (session expired/revoked) */
const authFailureListeners = new Set<() => void>();

/** Prevents multiple simultaneous token refresh attempts */
let refreshPromise: Promise<"success" | "unauthorized" | "forbidden"> | null =
  null;

// ============================================================================
// Auth Failure Notifications
// ============================================================================

/**
 * Subscribe to auth failure events (401, 403, revocation, etc).
 * Returns unsubscribe function.
 */
export function subscribeToAuthFailure(listener: () => void): () => void {
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}

/**
 * Notify all listeners that auth has failed and needs cleanup.
 */
function notifyAuthFailure() {
  for (const listener of authFailureListeners) {
    try {
      listener();
    } catch (error) {
      if (DEBUG) console.error("[auth] Failure listener crashed", error);
    }
  }
}

// ============================================================================
// Token Validation & Decoding
// ============================================================================

/**
 * Decode JWT payload without verification.
 * Does NOT validate signature—use only for expiryvalidation.
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1]);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired (exp claim in past).
 */
function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false; // No exp claim = assume not expired
  return payload.exp * 1000 < Date.now();
}

// ============================================================================
// Token Access & Persistence
// ============================================================================

/**
 * Initialize access token from storage (called on app boot).
 */
export function initializeAccessToken(): void {
  const stored = readStoredAccessToken();
  accessToken = stored;
  if (DEBUG && stored) {
    console.info("[auth] Initialized access token from storage");
  }
}

/**
 * Get current access token (in-memory, with fallback to storage).
 */
export function getAccessToken(): string | null {
  // Prefer in-memory; fall back to storage in case of memory loss
  return accessToken ?? readStoredAccessToken();
}

/**
 * Set access token in memory and storage.
 * Bumps auth generation on clear to prevent stale token reuse.
 */
export function setAccessToken(token: string | null): void {
  if (!token) {
    authGeneration += 1;
    if (DEBUG) console.info("[auth] Generation bumped on token clear");
  }
  accessToken = token;
  writeStoredAccessToken(token);
}

/**
 * Clear access token from memory and storage.
 */
export function clearAccessToken(): void {
  setAccessToken(null);
}

/**
 * Get current auth generation (used to prevent stale refresh saves).
 */
export function getAuthGeneration(): number {
  return authGeneration;
}

// ============================================================================
// Token Refresh (Composable, Isolated)
// ============================================================================

/**
 * Attempt to refresh access token using refresh token (via HttpOnly cookie).
 * Prevents multiple simultaneous refresh requests.
 * Returns success status; does NOT throw.
 */
export async function refreshAccessToken(): Promise<
  "success" | "unauthorized" | "forbidden"
> {
  // If already refreshing, return the existing promise
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const generationAtStart = authGeneration;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include", // Send HttpOnly refresh token cookie
      });

      if (!response.ok) {
        if (response.status === 403) return "forbidden";
        return "unauthorized";
      }

      const body = (await response.json().catch(() => null)) as {
        accessToken?: string;
      } | null;

      if (!body?.accessToken) {
        clearAccessToken();
        return "unauthorized";
      }

      // If user logged out while we were refreshing, discard the new token
      if (authGeneration !== generationAtStart) {
        clearAccessToken();
        if (DEBUG) console.warn("[auth] Discarding refreshed token due to generation mismatch");
        return "unauthorized";
      }

      setAccessToken(body.accessToken);
      if (DEBUG) console.info("[auth] Token refreshed successfully");
      return "success";
    } catch (error) {
      clearAccessToken();
      if (DEBUG)
        console.error("[auth] Refresh token request failed", {
          url: `${API_BASE_URL}/auth/token/refresh`,
          error,
        });
      return "unauthorized";
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ============================================================================
// Session Logout (Complete Cleanup)
// ============================================================================

/**
 * Perform complete session cleanup on logout.
 * - Clears all stored auth data
 * - Bumps generation
 * - Notifies listeners
 */
export function performSessionCleanup(): void {
  clearAccessToken(); // Bumps generation + clears storage
  clearAllAuthStorage(); // Clear temp tokens (pending phone, signup token, etc)
  notifyAuthFailure(); // Notify all listeners
  if (DEBUG) console.info("[auth] Session cleanup completed");
}

// ============================================================================
// Debug Utilities
// ============================================================================

export function debugGetTokenInfo() {
  if (!DEBUG) return null;
  const token = getAccessToken();
  const payload = token ? decodeJwtPayload(token) : null;
  return {
    tokenExists: !!token,
    tokenLength: token?.length ?? 0,
    isExpired: isTokenExpired(token),
    generation: authGeneration,
    payload: payload ? { sub: payload.sub, iat: payload.iat, exp: payload.exp } : null,
  };
}
