import { env } from "./env";

export const deviceCookieName = "em_device";

function resolveSameSite() {
  try {
    const webOrigin = new URL(env.WEB_ORIGIN);
    const adminOrigin = env.ADMIN_ORIGIN ? new URL(env.ADMIN_ORIGIN) : null;
    const needsCrossSiteCookies = Boolean(adminOrigin && adminOrigin.hostname !== webOrigin.hostname);
    return needsCrossSiteCookies ? "none" as const : "lax" as const;
  } catch {
    return "none" as const;
  }
}

const sharedCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: resolveSameSite(),
  path: "/"
};

export const deviceCookieOptions = {
  ...sharedCookieOptions,
  maxAge: 1000 * 60 * 60 * 24 * 30
};

export const sessionCookieName = "connect.sid";

export const sessionCookieOptions = {
  ...sharedCookieOptions,
  maxAge: 1000 * 60 * 60 * 24 * env.REFRESH_TOKEN_TTL_DAYS
};

export const refreshCookieName = "em_refresh";

export function buildRefreshCookieOptions(ttlDays: number) {
  return {
    ...sharedCookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * ttlDays
  };
}
