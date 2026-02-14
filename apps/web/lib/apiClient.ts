import { clearAccessToken, getAccessToken, setAccessToken } from "./authToken";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const fallbackApiUrl = "http://localhost:4000";

if (!configuredApiUrl && process.env.NODE_ENV !== "test") {
  console.warn(
    `NEXT_PUBLIC_API_BASE_URL is not set; defaulting to ${fallbackApiUrl} for local development.`
  );
}

const rawApiUrl = configuredApiUrl || fallbackApiUrl;

if (rawApiUrl.startsWith("http://") && !/http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(rawApiUrl)) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL must be https unless using localhost.");
}

export const API_URL = rawApiUrl.replace(/\/$/, "");

type ApiFetchOptions = RequestInit & {
  auth?: "include" | "omit";
  retryOnUnauthorized?: boolean;
  withCredentials?: boolean;
};

let refreshInFlight: Promise<string | null> | null = null;

function shouldIncludeCredentials(path: string, options: ApiFetchOptions) {
  if (options.withCredentials) return true;
  return path === "/auth/token/refresh" || path === "/auth/logout";
}

function handleRefreshFailure() {
  clearAccessToken();
  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
}

function extractErrorMessage(payload: any, fallback: string) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (payload.message && typeof payload.message === "string") return payload.message;
  if (payload.error) {
    if (typeof payload.error === "string") return payload.error;
    if (payload.error.message && typeof payload.error.message === "string") return payload.error.message;
    const fieldErrors = payload.error?.fieldErrors;
    if (fieldErrors && typeof fieldErrors === "object") {
      const messages = Object.values(fieldErrors)
        .flat()
        .filter(Boolean);
      if (messages.length) return messages.join(", ");
    }
    const formErrors = payload.error?.formErrors;
    if (Array.isArray(formErrors) && formErrors.length) return formErrors.join(", ");
  }
  return fallback;
}

export class ApiError extends Error {
  fieldErrors?: Record<string, string[]>;
  status?: number;

  constructor(message: string, options?: { fieldErrors?: Record<string, string[]>; status?: number }) {
    super(message);
    this.name = "ApiError";
    this.fieldErrors = options?.fieldErrors;
    this.status = options?.status;
  }
}

export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}) {
  return apiFetchWithRetry<T>(path, options, false);
}

async function apiFetchWithRetry<T>(path: string, options: ApiFetchOptions, hasRetried: boolean) {
  const headers = new Headers(options.headers);
  const method = (options.method ?? "GET").toUpperCase();
  const hasBody = options.body !== undefined && options.body !== null;
  if (hasBody && !headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const authMode = options.auth ?? "include";
  const token = authMode !== "omit" ? getAccessToken() : null;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const resolvedBody = hasBody && options.body && typeof options.body === "object" && !(options.body instanceof FormData) && !(options.body instanceof Blob) && !(options.body instanceof ArrayBuffer)
    ? JSON.stringify(options.body)
    : options.body;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    method,
    body: resolvedBody,
    headers,
    credentials: shouldIncludeCredentials(path, options) ? "include" : "omit",
    cache: "no-store"
  });
  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();
  if (res.status === 401 && options.retryOnUnauthorized && !hasRetried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetchWithRetry<T>(path, options, true);
    }
    handleRefreshFailure();
  }
  if (!res.ok) {
    const message = extractErrorMessage(payload, "Request failed. Please try again.");
    const fieldErrors = payload?.fieldErrors ?? payload?.error?.fieldErrors ?? undefined;
    throw new ApiError(message, { fieldErrors, status: res.status });
  }
  return payload as T;
}

export async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const res = await fetch(`${API_URL}/auth/token/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: "{}",
        credentials: "include",
        cache: "no-store"
      });
      if (!res.ok) {
        return null;
      }
      const payload = (await res.json()) as { ok?: boolean; accessToken?: string };
      if (payload.accessToken) {
        setAccessToken(payload.accessToken);
        return payload.accessToken;
      }
      return null;
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}
