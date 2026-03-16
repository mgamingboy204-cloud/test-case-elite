function resolveApiBaseUrl() {
  const configured = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim();
  const fallback = "http://localhost:4000";
  const baseUrl = (configured || fallback).replace(/\/$/, "");

  if (process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/.test(baseUrl)) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must not point to localhost in production.");
  }

  return baseUrl;
}

export const API_BASE_URL = resolveApiBaseUrl();
const apiDebug = process.env.NODE_ENV !== "production";

const ACCESS_TOKEN_STORAGE_KEY = "vael_access_token";

let accessToken: string | null = null;

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
  accessToken = token;
  writeStoredAccessToken(token);
}

export function clearAccessToken() {
  setAccessToken(null);
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

let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
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
        return false;
      }

      const body = (await response.json().catch(() => null)) as { accessToken?: string } | null;
      if (!body?.accessToken) {
        clearAccessToken();
        return false;
      }

      setAccessToken(body.accessToken);
      return true;
    } catch (error) {
      clearAccessToken();
      if (apiDebug) console.error("[auth] Refresh token request failed", {
        url: `${API_BASE_URL}/auth/token/refresh`,
        error
      });
      return false;
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
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      if (apiDebug) console.info("[api] Refresh succeeded. Retrying request", { method, path });
      const retry = await runRequest();
      response = retry.response;
      body = retry.body;
    } else {
      clearAccessToken();
      if (apiDebug) console.warn("[api] Refresh failed. Request remains unauthorized", { method, path });
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
