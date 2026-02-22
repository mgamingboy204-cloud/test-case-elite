import { env } from "./env";

const isProd = env.NODE_ENV === "production";

const isCrossOrigin = Boolean(env.API_ORIGIN && env.API_ORIGIN !== env.WEB_ORIGIN);
const refreshSameSite = isCrossOrigin ? ("none" as const) : ("lax" as const);

export const deviceCookieName = "em_device";

export const deviceCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 30
};

export const sessionCookieName = "connect.sid";

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProd,
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * env.REFRESH_TOKEN_TTL_DAYS
};

export const refreshCookieName = "em_refresh";

export function buildRefreshCookieOptions(ttlDays: number) {
  return {
    httpOnly: true,
    sameSite: refreshSameSite,
    secure: isProd,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * ttlDays
  };
}
