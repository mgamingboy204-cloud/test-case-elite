export const deviceCookieName = "em_device";

export const deviceCookieOptions = {
  httpOnly: true,
  sameSite: "none" as const,
  secure: true,
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 30
};

export const sessionCookieName = "connect.sid";

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "none" as const,
  secure: true,
  path: "/"
};

export const refreshCookieName = "em_refresh";

export function buildRefreshCookieOptions(ttlDays: number) {
  return {
    httpOnly: true,
    sameSite: "none" as const,
    secure: true,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * ttlDays
  };
}
