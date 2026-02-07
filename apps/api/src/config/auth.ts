import { env } from "./env";

export const deviceCookieName = "em_device";

export const deviceCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 30
};

export const sessionCookieName = "connect.sid";

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  secure: env.NODE_ENV === "production",
  path: "/"
};

export const refreshCookieName = "em_refresh";

export function buildRefreshCookieOptions(ttlDays: number) {
  return {
    httpOnly: true,
    sameSite: (env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * ttlDays
  };
}
