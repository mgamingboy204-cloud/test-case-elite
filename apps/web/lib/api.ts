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

export function setAuthToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem("elite_access_token");
    return;
  }
  localStorage.setItem("elite_access_token", token);
}

export async function apiRequest<T>(path: string, options?: RequestInit & { auth?: boolean }) {
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");

  if (options?.auth) {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "message" in body
      ? String((body as { message?: string }).message)
      : `Request failed: ${response.status}`;
    throw new ApiError(message, response.status, body);
  }

  return body as T;
}
