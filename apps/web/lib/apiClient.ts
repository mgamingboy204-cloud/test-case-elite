import { ZodError } from "zod";
import { clearAccessToken, getAccessToken, setAccessToken } from "./authToken";
import { ApiEndpoint, apiEndpoints } from "./apiEndpoints";

const configuredApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const fallbackApiUrl = "http://localhost:4000";

if (!configuredApiUrl && process.env.NODE_ENV !== "test") {
  console.warn(`NEXT_PUBLIC_API_BASE_URL is not set; defaulting to ${fallbackApiUrl} for local development.`);
}

const rawApiUrl = configuredApiUrl || fallbackApiUrl;

if (rawApiUrl.startsWith("http://") && !/http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(rawApiUrl)) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL must be https unless using localhost.");
}

export const API_URL = rawApiUrl.replace(/\/$/, "");

type ApiFetchOptions<TReq> = Omit<RequestInit, "body" | "method"> & {
  auth?: "include" | "omit";
  retryOnUnauthorized?: boolean;
  withCredentials?: boolean;
  body?: TReq;
  params?: Record<string, string>;
};

let refreshInFlight: Promise<string | null> | null = null;

function shouldIncludeCredentials(path: string, options: { withCredentials?: boolean }) {
  if (options.withCredentials) return true;
  return path === "/auth/token/refresh" || path === "/auth/logout";
}

function handleRefreshFailure() {
  clearAccessToken();
  if (typeof window !== "undefined") window.location.href = "/auth/login";
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

export class ApiContractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiContractError";
  }
}

function extractErrorMessage(payload: any, fallback: string) {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (payload.message && typeof payload.message === "string") return payload.message;
  if (payload.error && typeof payload.error === "string") return payload.error;
  return fallback;
}

export async function apiFetch<TReq, TRes>(endpoint: ApiEndpoint<TReq, TRes>, options: ApiFetchOptions<TReq> = {}) {
  return apiFetchWithRetry(endpoint, options, false);
}

async function apiFetchWithRetry<TReq, TRes>(endpoint: ApiEndpoint<TReq, TRes>, options: ApiFetchOptions<TReq>, hasRetried: boolean): Promise<TRes> {
  const path = typeof endpoint.path === "function" ? endpoint.path(options.params ?? {}) : endpoint.path;
  const method = endpoint.method;
  const headers = new Headers(options.headers);
  const authMode = options.auth ?? "include";

  const requestBody = options.body ?? undefined;
  if (requestBody !== undefined && endpoint.requestSchema) {
    endpoint.requestSchema.parse(requestBody);
  }

  if (requestBody !== undefined && !headers.has("Content-Type") && !(requestBody instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = authMode !== "omit" ? getAccessToken() : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const resolvedBody = requestBody !== undefined && typeof requestBody === "object" && !(requestBody instanceof FormData)
    ? JSON.stringify(requestBody)
    : (requestBody as BodyInit | undefined);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    method,
    headers,
    body: resolvedBody,
    credentials: shouldIncludeCredentials(path, options) ? "include" : "omit",
    cache: "no-store"
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (res.status === 401 && options.retryOnUnauthorized && !hasRetried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetchWithRetry(endpoint, options, true);
    handleRefreshFailure();
  }

  if (!res.ok) {
    const fieldErrors = payload?.fieldErrors ?? payload?.error?.fieldErrors ?? undefined;
    throw new ApiError(extractErrorMessage(payload, "Request failed. Please try again."), { status: res.status, fieldErrors });
  }

  try {
    return endpoint.responseSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new ApiContractError(`Response contract mismatch for ${endpoint.name}: ${JSON.stringify(payload).slice(0, 300)}`);
    }
    throw error;
  }
}

export async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const payload = await apiFetch(apiEndpoints.authTokenRefresh, {
        auth: "omit",
        withCredentials: true,
        body: {}
      });
      if (payload.accessToken) {
        setAccessToken(payload.accessToken);
        return payload.accessToken;
      }
      return null;
    })().catch(() => null).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}
