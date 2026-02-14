import { getAccessToken, setAccessToken } from "./authToken";

interface ApiFetchOptions extends RequestInit {
  auth?: "omit" | "include";
  retryOnUnauthorized?: boolean;
}

const rawApiBase = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;

if (!rawApiBase) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL (or NEXT_PUBLIC_API_URL) environment variable.");
}

const API_BASE = rawApiBase.replace(/\/$/, "");

function extractMessage(payload: any): string {
  if (!payload) return "Something went wrong";
  if (typeof payload === "string") return payload;
  if (typeof payload.message === "string") return payload.message;
  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.error?.message === "string") return payload.error.message;
  const fieldErrors = payload.error?.fieldErrors ?? payload.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const entries = Object.values(fieldErrors).flat().filter(Boolean);
    if (entries.length) return entries.join(", ");
  }
  return "Something went wrong";
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  return apiFetchWithRetry<T>(path, options, false);
}

async function apiFetchWithRetry<T>(path: string, options: ApiFetchOptions, hasRetried: boolean): Promise<T> {
  const { auth = "include", retryOnUnauthorized = true, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);

  const method = (fetchOptions.method || "GET").toUpperCase();
  const hasBody = fetchOptions.body !== undefined && fetchOptions.body !== null;
  const shouldJsonEncodeBody =
    hasBody &&
    method !== "GET" &&
    method !== "HEAD" &&
    !(fetchOptions.body instanceof FormData) &&
    typeof fetchOptions.body !== "string" &&
    !headers.has("Content-Type");

  if (shouldJsonEncodeBody) {
    headers.set("Content-Type", "application/json");
  }

  if (auth === "include") {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    credentials: "include",
    headers,
    cache: "no-store",
    body: shouldJsonEncodeBody ? JSON.stringify(fetchOptions.body) : fetchOptions.body,
  });

  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (res.status === 401 && auth === "include" && retryOnUnauthorized && !hasRetried) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetchWithRetry<T>(path, options, true);
    }
  }

  if (!res.ok) {
    throw new Error(extractMessage(payload));
  }

  return payload as T;
}

export async function refreshAccessToken() {
  const res = await fetch(`${API_BASE}/auth/token/refresh`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
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
