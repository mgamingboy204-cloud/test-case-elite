/**
 * Session token service.
 * Frontend strategy:
 * - Access token lives in memory only
 * - Refresh token lives in an httpOnly cookie
 * - Temporary signup flow state is handled elsewhere
 */

import { API_BASE_URL } from "@/lib/apiBaseUrl";

const DEBUG = process.env.NODE_ENV !== "production";

let accessToken: string | null = null;
let authGeneration = 0;
const authFailureListeners = new Set<() => void>();
let refreshPromise: Promise<"success" | "unauthorized" | "forbidden"> | null =
  null;

type JwtPayload = {
  exp?: number;
  sub?: string;
  iat?: number;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const decoded = atob(parts[1]);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function isLikelyJwt(token: string) {
  return token.split(".").length === 3;
}

function isTokenExpired(token: string | null): boolean {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 < Date.now();
}

export function subscribeToAuthFailure(listener: () => void): () => void {
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}

export function notifyAuthFailure() {
  for (const listener of authFailureListeners) {
    try {
      listener();
    } catch (error) {
      if (DEBUG) console.error("[auth] Failure listener crashed", error);
    }
  }
}

export function getAccessToken(): string | null {
  if (accessToken && isTokenExpired(accessToken)) {
    clearAccessToken();
  }
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  if (!token) {
    authGeneration += 1;
    accessToken = null;
    if (DEBUG) console.info("[auth] Cleared access token");
    return;
  }

  const normalized = token.trim();
  if (!normalized || !isLikelyJwt(normalized) || isTokenExpired(normalized)) {
    authGeneration += 1;
    accessToken = null;
    if (DEBUG) console.warn("[auth] Rejected invalid access token");
    return;
  }

  accessToken = normalized;
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

export function getAuthGeneration(): number {
  return authGeneration;
}

export async function refreshAccessToken(options?: {
  allowMissingSession?: boolean;
}): Promise<"success" | "unauthorized" | "forbidden"> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const generationAtStart = authGeneration;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 403) return "forbidden";
        if (response.status === 401 && options?.allowMissingSession)
          return "unauthorized";
        return "unauthorized";
      }

      const body = (await response.json().catch(() => null)) as {
        accessToken?: string;
      } | null;

      if (!body?.accessToken || !isLikelyJwt(body.accessToken)) {
        clearAccessToken();
        return "unauthorized";
      }

      if (authGeneration !== generationAtStart) {
        clearAccessToken();
        if (DEBUG)
          console.warn(
            "[auth] Discarding refreshed token due to generation mismatch"
          );
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

export function debugGetTokenInfo() {
  if (!DEBUG) return null;
  const token = getAccessToken();
  const payload = token ? decodeJwtPayload(token) : null;
  return {
    tokenExists: !!token,
    tokenLength: token?.length ?? 0,
    isExpired: isTokenExpired(token),
    generation: authGeneration,
    payload: payload
      ? { sub: payload.sub, iat: payload.iat, exp: payload.exp }
      : null,
  };
}
