import { env } from "./env";

const isProd = env.NODE_ENV === "production";

export const deviceCookieName = "em_device";

export const deviceCookieOptions = {
  httpOnly: true,
  sameSite: isProd ? ("none" as const) : ("lax" as const),
  secure: isProd,
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 30
};

export const sessionCookieName = "connect.sid";

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: isProd ? ("none" as const) : ("lax" as const),
  secure: isProd,
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * env.REFRESH_TOKEN_TTL_DAYS
};

export const refreshCookieName = "em_refresh";

export function buildRefreshCookieOptions(ttlDays: number) {
  return {
    httpOnly: true,
    sameSite: isProd ? ("none" as const) : ("lax" as const),
    secure: isProd,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * ttlDays
  };
}
