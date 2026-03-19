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

const ACCESS_TOKEN_STORAGE_KEY = "vael_access_token";

let accessToken: string | null = null;
const authFailureListeners = new Set<() => void>();
let authGeneration = 0;

function readStoredAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

function writeStoredAccessToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
    return;
  }
  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function initializeAccessToken() {
  accessToken = readStoredAccessToken();
}

export function setAccessToken(token: string | null) {
  // Bump generation when clearing so in-flight refreshes can't re-save tokens.
  if (!token) authGeneration += 1;
  accessToken = token;
  writeStoredAccessToken(token);
}

export function clearAccessToken() {
  setAccessToken(null);
}

export function subscribeToAuthFailure(listener: () => void) {
  authFailureListeners.add(listener);
  return () => {
    authFailureListeners.delete(listener);
  };
}

function notifyAuthFailure() {
  for (const listener of authFailureListeners) {
    try {
      listener();
    } catch (error) {
      if (apiDebug) console.error("[auth] Auth failure listener crashed", error);
    }
  }
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

let refreshPromise: Promise<"success" | "unauthorized" | "forbidden"> | null = null;

async function refreshAccessToken(): Promise<"success" | "unauthorized" | "forbidden"> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const generationAtStart = authGeneration;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/token/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({}),
        credentials: "include"
      });

      if (!response.ok) {
        if (response.status === 403) return "forbidden";
        return "unauthorized";
      }

      const body = (await response.json().catch(() => null)) as { accessToken?: string } | null;
      if (!body?.accessToken) {
        clearAccessToken();
        return "unauthorized";
      }

      // If the user logged out while we were refreshing, do not store a new token.
      if (authGeneration !== generationAtStart) {
        clearAccessToken();
        return "unauthorized";
      }

      setAccessToken(body.accessToken);
      return "success";
    } catch (error) {
      clearAccessToken();
      if (apiDebug) console.error("[auth] Refresh token request failed", {
        url: `${API_BASE_URL}/auth/token/refresh`,
        error
      });
      return "unauthorized";
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options?: RequestInit & { auth?: boolean }) {
  const method = options?.method ?? "GET";

  const runRequest = async () => {
    const headers = new Headers(options?.headers);
    const resolvedAccessToken = accessToken ?? readStoredAccessToken();
    accessToken = resolvedAccessToken;
    if (options?.auth && resolvedAccessToken && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${resolvedAccessToken}`);
    }
    const hasJsonBody = options?.body !== undefined && !(options.body instanceof FormData);
    if (hasJsonBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: "include"
      });
    } catch (error) {
      if (apiDebug) console.error("[api] Network request failed", {
        method,
        path,
        auth: options?.auth ?? false,
        error
      });
      throw new ApiError(`Network error while calling ${method} ${path}`, 0, {
        cause: error instanceof Error ? error.message : String(error)
      });
    }

    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();

    return { response, body };
  };

  let { response, body } = await runRequest();

  if (options?.auth && response.status === 401 && !path.startsWith("/auth/")) {
    if (apiDebug) console.warn("[api] Received 401 on authenticated request. Attempting token refresh", { method, path });
    const refreshStatus = await refreshAccessToken();
    if (refreshStatus === "success") {
      if (apiDebug) console.info("[api] Refresh succeeded. Retrying request", { method, path });
      const retry = await runRequest();
      response = retry.response;
      body = retry.body;
    } else {
      clearAccessToken();
      notifyAuthFailure();
      if (apiDebug) console.warn("[api] Refresh failed. Request remains unauthorized", { method, path, refreshStatus });
    }
  }

  if (options?.auth && response.status === 403) {
    const rawCode = typeof body === "object" && body !== null && "code" in body
      ? String((body as { code?: string }).code ?? "").toLowerCase()
      : "";
    if (rawCode.includes("unauth") || rawCode.includes("token") || rawCode.includes("session")) {
      clearAccessToken();
      notifyAuthFailure();
    }
  }

  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "message" in body
      ? String((body as { message?: string }).message)
      : `Request failed: ${response.status}`;
    if (apiDebug) console.error("[api] Request failed", { method, path, status: response.status, body });
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}

export async function apiRequestAuth<T>(path: string, options?: Omit<RequestInit, "headers"> & { headers?: HeadersInit }) {
  return apiRequest<T>(path, { ...options, auth: true });
}
