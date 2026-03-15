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

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export function getAuthToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vael_access_token");
}


export function getOnboardingToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("vael_onboarding_token");
}

export function setOnboardingToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem("vael_onboarding_token");
    return;
  }
  localStorage.setItem("vael_onboarding_token", token);
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem("vael_access_token");
    return;
  }
  localStorage.setItem("vael_access_token", token);
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
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
        setAuthToken(null);
        return null;
      }

      const payload = (await response.json()) as { accessToken?: string };
      if (!payload.accessToken) {
        setAuthToken(null);
        return null;
      }

      setAuthToken(payload.accessToken);
      return payload.accessToken;
    } catch (error) {
      console.error("[auth] Refresh token request failed", {
        url: `${API_BASE_URL}/auth/token/refresh`,
        error
      });
      setAuthToken(null);
      return null;
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
    const hasJsonBody = options?.body !== undefined && !(options.body instanceof FormData);
    if (hasJsonBody && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (options?.auth) {
      const token = getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      const onboardingToken = getOnboardingToken();
      if (onboardingToken) {
        headers.set("x-onboarding-token", onboardingToken);
      }
    }

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: "include"
      });
    } catch (error) {
      console.error("[api] Network request failed", {
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
    console.warn("[api] Received 401 on authenticated request. Attempting token refresh", { method, path });
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      console.info("[api] Refresh succeeded. Retrying request", { method, path });
      const retry = await runRequest();
      response = retry.response;
      body = retry.body;
    } else {
      console.warn("[api] Refresh failed. Request remains unauthorized", { method, path });
    }
  }

  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "message" in body
      ? String((body as { message?: string }).message)
      : `Request failed: ${response.status}`;
    console.error("[api] Request failed", { method, path, status: response.status, body });
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}
