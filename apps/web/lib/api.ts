import { getAccessToken, setAccessToken } from "./authToken";

const rawApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL;

if (!rawApiUrl && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required in production.");
}
if (rawApiUrl && process.env.NODE_ENV === "production" && rawApiUrl.startsWith("http://")) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL must be https in production.");
}

export const API_URL = (rawApiUrl ?? "http://localhost:4000").replace(/\/$/, "");

type ApiFetchOptions = RequestInit & {
  auth?: "include" | "omit";
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
  return apiFetchWithRetry<T>(path, options);
}

async function apiFetchWithRetry<T>(path: string, options: ApiFetchOptions) {
  const headers = new Headers(options.headers);
  if (options.method && options.method !== "GET" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const authMode = options.auth ?? "include";
  const token = authMode !== "omit" ? getAccessToken() : null;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store"
  });
  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const message = extractErrorMessage(payload, "Request failed. Please try again.");
    const fieldErrors =
      payload?.fieldErrors ??
      payload?.error?.fieldErrors ??
      undefined;
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
  const payload = (await res.json()) as { accessToken?: string };
  if (payload.accessToken) {
    setAccessToken(payload.accessToken);
    return payload.accessToken;
  }
  return null;
}
