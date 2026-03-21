function isLoopbackHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

function alignLoopbackHost(baseUrl: string) {
  if (typeof window === "undefined") return baseUrl;

  try {
    const url = new URL(baseUrl);
    const currentHostname = window.location.hostname;

    if (
      isLoopbackHost(url.hostname) &&
      isLoopbackHost(currentHostname) &&
      url.hostname !== currentHostname
    ) {
      url.hostname = currentHostname;
      return url.toString().replace(/\/$/, "");
    }
  } catch {
    return baseUrl;
  }

  return baseUrl;
}

export function resolveApiBaseUrl() {
  const configured = (
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    ""
  ).trim();
  const fallback = "http://localhost:4000";
  const baseUrl = (configured || fallback).replace(/\/$/, "");

  if (
    process.env.NODE_ENV === "production" &&
    (process.env.VERCEL === "1" || Boolean(process.env.VERCEL_URL)) &&
    /localhost|127\.0\.0\.1/.test(baseUrl)
  ) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL must not point to localhost in production."
    );
  }

  return alignLoopbackHost(baseUrl);
}

export const API_BASE_URL = resolveApiBaseUrl();
