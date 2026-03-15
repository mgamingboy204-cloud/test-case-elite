export const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}`;

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
  return localStorage.getItem("elite_access_token");
}


export function getOnboardingToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("elite_onboarding_token");
}

export function setOnboardingToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem("elite_onboarding_token");
    return;
  }
  localStorage.setItem("elite_onboarding_token", token);
}

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem("elite_access_token");
    return;
  }
  localStorage.setItem("elite_access_token", token);
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
    } catch {
      setAuthToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options?: RequestInit & { auth?: boolean }) {
  const runRequest = async () => {
    const headers = new Headers(options?.headers);
    headers.set("Content-Type", "application/json");

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

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: "include"
    });

    const contentType = response.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json") ? await response.json() : await response.text();

    return { response, body };
  };

  let { response, body } = await runRequest();

  if (options?.auth && response.status === 401 && !path.startsWith("/auth/")) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      const retry = await runRequest();
      response = retry.response;
      body = retry.body;
    }
  }

  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "message" in body
      ? String((body as { message?: string }).message)
      : `Request failed: ${response.status}`;
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}
