import { getAccessToken, setAccessToken } from "./authToken";

const rawApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!rawApiUrl) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required.");
}

const isLocalhost =
  rawApiUrl.includes("localhost") || rawApiUrl.includes("127.0.0.1");

if (!isLocalhost && rawApiUrl.startsWith("http://")) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL must be https in non-local environments.");
}

export const API_URL = rawApiUrl.replace(/\/$/, "");

type ApiFetchOptions = RequestInit & {
  auth?: "include" | "omit";
  retryOnUnauthorized?: boolean;
};

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
  }
  if (!res.ok) {
    const message = extractErrorMessage(payload, "Request failed. Please try again.");
    const fieldErrors = payload?.fieldErrors ?? payload?.error?.fieldErrors ?? undefined;
    throw new ApiError(message, { fieldErrors, status: res.status });
  }
  return payload as T;
}

export async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/token/refresh`, {
    method: "POST",
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
}
