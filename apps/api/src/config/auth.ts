import { env } from "./env";

const isProd = env.NODE_ENV === "production";

type SameSite = "strict" | "lax" | "none";

// Production deployments are typically cross-site (Vercel web -> Render API).
// For httpOnly cookies to be accepted/sent by browsers, production must use SameSite=None + Secure.
const refreshSameSite: SameSite = isProd ? "none" : "lax";

export const deviceCookieName = "em_device";

export const deviceCookieOptions = {
  httpOnly: true,
  sameSite: refreshSameSite,
  secure: isProd ? true : false,
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 30
};

export const refreshCookieName = "em_refresh";

export function buildRefreshCookieOptions(ttlDays: number) {
  const secure = isProd ? true : false;
  return {
    httpOnly: true,
    sameSite: refreshSameSite,
    secure,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * ttlDays
  };
}
