import { clearAuthToken, getAuthToken, getAuthTokenStorage, setAuthToken } from "./authToken";

const rawApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL;

if (!rawApiUrl && process.env.NODE_ENV === "production") {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required in production.");
}

export const API_URL = rawApiUrl ?? "http://localhost:4000";

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

export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}) {
  return apiFetchWithRetry<T>(path, options, true);
}

async function refreshAccessToken() {
  const res = await fetch(`${API_URL}/auth/token/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({})
  });
  if (!res.ok) {
    clearAuthToken();
    return null;
  }
  const data = (await res.json()) as { accessToken?: string };
  if (data?.accessToken) {
    const mode = getAuthTokenStorage();
    setAuthToken(data.accessToken, mode !== "session");
    return data.accessToken;
  }
  return null;
}

async function apiFetchWithRetry<T>(path: string, options: ApiFetchOptions, allowRetry: boolean) {
  const headers = new Headers(options.headers);
  if (options.method && options.method !== "GET" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth !== "omit" && !headers.has("Authorization")) {
    const token = getAuthToken()?.trim();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store"
  });
  if (res.status === 401 && options.auth !== "omit" && allowRetry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = new Headers(options.headers);
      if (options.method && options.method !== "GET" && !retryHeaders.has("Content-Type")) {
        retryHeaders.set("Content-Type", "application/json");
      }
      retryHeaders.set("Authorization", `Bearer ${refreshed}`);
      return apiFetchWithRetry<T>(path, { ...options, headers: retryHeaders }, false);
    }
  }
  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const message = extractErrorMessage(payload, "Request failed. Please try again.");
    throw new Error(message);
  }
  return payload as T;
}
