import { clearAccessToken, getAccessToken, setAccessToken } from "./authToken";

const rawApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (rawApiUrl?.startsWith("http://")) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL must be https.");
}

export const API_URL = "/api";

function logAuthRequest(event: string, details: Record<string, unknown>) {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.debug(`[auth-client] ${event}`, details);
  }
}

type ApiFetchOptions = RequestInit & {
  auth?: "include" | "omit";
  retryOnUnauthorized?: boolean;
};

let refreshPromise: Promise<string | null> | null = null;
let authFailed = false;
let logoutTriggered = false;

const AUTH_ROUTES = new Set(["/login", "/signup", "/otp"]);
const PWA_AUTH_ROUTES = new Set([
  "/pwa_app",
  "/pwa_app/splash",
  "/pwa_app/get-started",
  "/pwa_app/login",
  "/signup"
]);
const PUBLIC_ROUTES = new Set([
  "/",
  "/learn",
  "/safety",
  "/faq",
  "/support",
  "/terms",
  "/privacy",
  "/cookie-policy",
  "/contact"
]);

function isAuthRoute(pathname: string) {
  if (PWA_AUTH_ROUTES.has(pathname)) return true;
  if (pathname.startsWith("/pwa_app/signup")) return true;
  if (AUTH_ROUTES.has(pathname)) return true;
  return pathname.startsWith("/auth");
}

function isPublicRoute(pathname: string) {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  return pathname.startsWith("/(marketing)");
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

function triggerAuthFailure(reason: string) {
  if (authFailed) return;
  authFailed = true;
  clearAccessToken();
  if (process.env.NODE_ENV !== "production") {
    logAuthRequest("state", { tokenPresent: Boolean(getAccessToken()), refreshAttempted: true, authFailed: true, reason });
  }
  if (typeof window === "undefined" || logoutTriggered) return;
  if (isAuthRoute(window.location.pathname) || isPublicRoute(window.location.pathname)) {
    if (process.env.NODE_ENV !== "production") {
      logAuthRequest("redirect.skipped", { reason, pathname: window.location.pathname });
    }
    return;
  }
  logoutTriggered = true;
  void fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
    cache: "no-store"
  }).catch(() => undefined).finally(() => {
    window.location.assign("/login");
  });
}

export function resetAuthFailureState() {
  authFailed = false;
  logoutTriggered = false;
}

export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}) {
  return apiFetchWithRetry<T>(path, options, false);
}

async function apiFetchWithRetry<T>(path: string, options: ApiFetchOptions, hasRetried: boolean) {
  const headers = new Headers(options.headers);
  const normalizedMethod = (options.method ?? "GET").toUpperCase();
  const hasBody = options.body !== undefined && options.body !== null;
  const shouldJsonEncodeBody =
    hasBody &&
    normalizedMethod !== "GET" &&
    normalizedMethod !== "HEAD" &&
    !headers.has("Content-Type") &&
    typeof options.body !== "string" &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof URLSearchParams) &&
    !(options.body instanceof Blob) &&
    !(options.body instanceof ArrayBuffer) &&
    !(ArrayBuffer.isView(options.body as any));

  if (shouldJsonEncodeBody) {
    headers.set("Content-Type", "application/json");
  }

  const body = shouldJsonEncodeBody ? JSON.stringify(options.body) : options.body;
  const authMode = options.auth ?? "include";
  const token = authMode !== "omit" ? getAccessToken() : null;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_URL}${path}`,
    {
      ...options,
      headers,
      body,
      credentials: "include",
      cache: "no-store"
    }
  );

  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (res.status === 401 && options.retryOnUnauthorized && !hasRetried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetchWithRetry<T>(path, options, true);
    }
    triggerAuthFailure("refresh_failed_after_401");
    throw new ApiError("Authentication required.", { status: 401 });
  }

  if (!res.ok) {
    const message = extractErrorMessage(payload, "Request failed. Please try again.");
    const fieldErrors = payload?.fieldErrors ?? payload?.error?.fieldErrors ?? undefined;
    throw new ApiError(message, { fieldErrors, status: res.status });
  }

  return payload as T;
}

export async function refreshAccessToken() {
  if (authFailed) {
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const requestUrl = `${API_URL}/auth/token/refresh`;
    const res = await fetch(requestUrl, {
      method: "POST",
      credentials: "include",
      cache: "no-store"
    });

    if (process.env.NODE_ENV !== "production") {
      logAuthRequest("refresh.attempt", {
        requestUrl,
        credentials: "include",
        configuredApiBaseUrl: rawApiUrl ?? null,
        status: res.status,
        authFailed
      });
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        triggerAuthFailure(`refresh_${res.status}`);
      }
      return null;
    }

    const payload = (await res.json()) as { ok?: boolean; accessToken?: string };
    if (payload.accessToken) {
      authFailed = false;
      setAccessToken(payload.accessToken);
      return payload.accessToken;
    }
    return null;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}
