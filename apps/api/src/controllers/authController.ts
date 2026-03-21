import { Request, Response } from "express";
import { refreshCookieName } from "../config/auth";
import { env } from "../config/env";
import { parseCookies } from "../utils/cookies";
import { prisma } from "../db/prisma";
import bcrypt from "bcrypt";
import {
  completeSignupWithPassword,
  registerPendingUser,
  requestSignupOtp,
  requestOtp,
  validateLogin,
  verifyOtpCodeOnly,
  verifyOtpBypassAndGetUser,
  verifyOtpAndGetUser
} from "../services/authService";
import { validateEmployeeLogin } from "../services/employeeService";
import { HttpError } from "../utils/httpErrors";
import { signSignupToken, verifyRefreshToken, verifySignupToken } from "../utils/jwt";
import {
  buildSessionUserPayload,
  clearAuthCookies,
  createSessionEnvelope,
  issueSessionTokens,
  getActiveAuthSession,
  touchAuthSession,
  revokeAuthSession,
  revokeAllAuthSessionsForUser
} from "../services/sessionService";

function logSessionEvent(event: string, details: Record<string, unknown>) {
  if (env.NODE_ENV !== "production" || env.DEV_OTP_LOG === "true" || process.env.AUTH_DEBUG === "1") {
    console.debug(`[auth] ${event}`, details);
  }
}

function getJwtErrorReason(error: unknown): "expired" | "signature_invalid" | "invalid_cookie" {
  if (error && typeof error === "object" && "name" in error) {
    const name = String((error as { name?: string }).name ?? "");
    if (name === "TokenExpiredError") return "expired";
    if (name === "JsonWebTokenError" || name === "NotBeforeError") return "signature_invalid";
  }
  return "invalid_cookie";
}

function resolveRememberPreference(
  value:
    | {
        rememberMe?: boolean;
        rememberDevice30Days?: boolean;
        rememberDevice?: boolean;
      }
    | null
    | undefined
) {
  return Boolean(value?.rememberMe ?? value?.rememberDevice30Days ?? value?.rememberDevice ?? false);
}

async function restoreSessionFromRefreshToken(req: Request, res: Response, options?: { includeUser?: boolean }) {
  const { refreshToken: refreshTokenFromBody } = (req.body ?? {}) as { refreshToken?: string };

  const cookieHeader = req.headers.cookie ?? "";
  const requestId = req.requestId;
  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = refreshTokenFromBody ?? cookies[refreshCookieName];

  logSessionEvent("refresh.attempt", {
    requestId,
    hasRefreshCookie: Boolean(cookies[refreshCookieName]),
    hasCookieHeader: Boolean(cookieHeader),
    includesRefreshCookie: cookieHeader.includes(`${refreshCookieName}=`),
    hasBodyRefreshToken: Boolean(refreshTokenFromBody)
  });

  if (!refreshToken) {
    clearAuthCookies(res);
    logSessionEvent("refresh.fail", { requestId, reason: "missing_cookie" });
    return {
      ok: false as const,
      status: 401,
      body: { message: "Missing refresh token", reason: "missing_cookie" }
    };
  }

  let verifiedRefresh: { userId: string; sessionId: string; tokenVersion: number };
  try {
    verifiedRefresh = verifyRefreshToken(refreshToken);
  } catch (error) {
    const reason = getJwtErrorReason(error);
    clearAuthCookies(res);
    logSessionEvent("refresh.fail", { requestId, reason });
    return {
      ok: false as const,
      status: 401,
      body: { message: "Invalid refresh token", reason }
    };
  }

  const user = await prisma.user.findUnique({ where: { id: verifiedRefresh.userId } });
  if (!user) {
    clearAuthCookies(res);
    logSessionEvent("refresh.fail", { requestId, userId: verifiedRefresh.userId, reason: "invalid_cookie" });
    return {
      ok: false as const,
      status: 401,
      body: { message: "Invalid refresh token", reason: "invalid_cookie" }
    };
  }

  if (user.deletedAt) {
    clearAuthCookies(res);
    return {
      ok: false as const,
      status: 403,
      body: { message: "Account deleted", reason: "account_deleted" }
    };
  }
  if (user.deactivatedAt) {
    clearAuthCookies(res);
    return {
      ok: false as const,
      status: 403,
      body: { message: "Account deactivated", reason: "account_deactivated" }
    };
  }
  if (user.status === "BANNED") {
    clearAuthCookies(res);
    return {
      ok: false as const,
      status: 403,
      body: { message: "Banned", reason: "account_banned" }
    };
  }
  if (user.tokenVersion !== verifiedRefresh.tokenVersion) {
    clearAuthCookies(res);
    logSessionEvent("refresh.fail", { requestId, userId: user.id, reason: "token_version_mismatch" });
    return {
      ok: false as const,
      status: 401,
      body: { message: "Invalid refresh token", reason: "token_version_mismatch" }
    };
  }

  const authSession = await getActiveAuthSession(verifiedRefresh.sessionId);
  if (!authSession || authSession.userId !== user.id) {
    clearAuthCookies(res);
    logSessionEvent("refresh.fail", { requestId, userId: user.id, reason: "session_not_found" });
    return {
      ok: false as const,
      status: 401,
      body: { message: "Invalid refresh token", reason: "session_not_found" }
    };
  }

  const rotatedSession = await touchAuthSession(authSession.id, authSession.rememberMe);

  const session = issueSessionTokens(res, {
    userId: user.id,
    rememberMe: rotatedSession.rememberMe,
    tokenVersion: user.tokenVersion,
    sessionId: rotatedSession.id
  });

  logSessionEvent("refresh.success", {
    requestId,
    userId: user.id,
    rememberMe: rotatedSession.rememberMe,
    refreshTtlDays: session.refreshTtlDays,
    refreshCookie: session.refreshCookie
  });

  return {
    ok: true as const,
    accessToken: session.accessToken,
    user: options?.includeUser ? await buildSessionUserPayload(user.id) : null
  };
}

export async function sendOtp(req: Request, res: Response) {
  const { phone } = req.body as { phone: string };
  await requestOtp(phone);
  return res.json({ ok: true });
}

export async function verifyOtp(req: Request, res: Response) {
  const { phone, code, rememberMe } = req.body as {
    phone: string;
    code: string;
    rememberMe?: boolean;
  };

  try {
    const user = await verifyOtpAndGetUser(phone, code);
    const resolvedRememberMe = rememberMe ?? false;
    const session = await createSessionEnvelope(res, {
      userId: user.id,
      rememberMe: resolvedRememberMe,
      tokenVersion: user.tokenVersion
    });

    logSessionEvent("otp-verified", { userId: user.id });
    return res.json(session);
  } catch (error) {
    if (error instanceof HttpError) throw error;
    return res.status(500).json({ message: "OTP verification failed. Please try again." });
  }
}

export async function verifyOtpMock(req: Request, res: Response) {
  if (!env.ALLOW_TEST_BYPASS) {
    throw new HttpError(404, { message: "Not found" });
  }
  const { phone, rememberMe } = req.body as { phone: string; rememberMe?: boolean };
  const user = await verifyOtpBypassAndGetUser(phone);
  const resolvedRememberMe = rememberMe ?? false;
  const session = await createSessionEnvelope(res, {
    userId: user.id,
    rememberMe: resolvedRememberMe,
    tokenVersion: user.tokenVersion
  });

  return res.json({
    ...session,
    mocked: true,
  });
}

export async function register(req: Request, res: Response) {
  const { phone, email, password } = req.body as {
    phone: string;
    email?: string;
    password: string;
  };

  await registerPendingUser({ phone, email, password });

  return res.json({ ok: true, otpRequired: true });
}

export async function signupStart(req: Request, res: Response) {
  const { phone } = req.body as { phone: string };
  await requestSignupOtp(phone);
  return res.json({ ok: true });
}

export async function signupVerify(req: Request, res: Response) {
  const { phone, code } = req.body as { phone: string; code: string };
  await verifyOtpCodeOnly(phone, code);
  const signupToken = signSignupToken(phone);
  return res.json({ ok: true, signupToken });
}

export async function signupVerifyMock(req: Request, res: Response) {
  if (!env.ALLOW_TEST_BYPASS) {
    throw new HttpError(404, { message: "Not found" });
  }
  const { phone } = req.body as { phone: string };
  const pending = await prisma.pendingUser.findUnique({ where: { phone } });
  if (!pending) {
    throw new HttpError(400, { message: "No signup in progress for this phone." });
  }
  const signupToken = signSignupToken(phone);
  return res.json({ ok: true, mocked: true, signupToken });
}

export async function signupComplete(req: Request, res: Response) {
  const { signupToken, password } = req.body as { signupToken: string; password: string };

  let phone: string;
  try {
    phone = verifySignupToken(signupToken);
  } catch {
    throw new HttpError(401, { message: "Signup session expired. Please verify OTP again." });
  }

  const user = await completeSignupWithPassword({ phone, password });
  const session = await createSessionEnvelope(res, {
    userId: user.id,
    rememberMe: true,
    tokenVersion: user.tokenVersion
  });

  return res.json(session);
}

export async function login(req: Request, res: Response) {
  const { phone, password, rememberMe, rememberDevice30Days, rememberDevice } = req.body as {
    phone: string;
    password: string;
    rememberMe?: boolean;
    rememberDevice30Days?: boolean;
    rememberDevice?: boolean;
  };

  const result = await validateLogin({ phone, password });

  if (result.otpRequired) {
    await requestOtp(phone);
    return res.json({ ok: true, otpRequired: true });
  }

  const resolvedRememberMe = resolveRememberPreference({
    rememberMe,
    rememberDevice30Days,
    rememberDevice
  });
  const session = await createSessionEnvelope(res, {
    userId: result.user.id,
    rememberMe: resolvedRememberMe,
    tokenVersion: result.user.tokenVersion
  });

  logSessionEvent("login", {
    userId: result.user.id,
    rememberMe: resolvedRememberMe,
    refreshTtlDays: session.cookies.refreshCookie.maxAge
      ? Math.round(session.cookies.refreshCookie.maxAge / (1000 * 60 * 60 * 24))
      : null,
    refreshCookie: session.cookies.refreshCookie
  });

  return res.json(session);
}

export async function employeeLogin(req: Request, res: Response) {
  const { employeeId, password, rememberMe } = req.body as {
    employeeId: string;
    password: string;
    rememberMe?: boolean;
  };

  const user = await validateEmployeeLogin({ employeeId, password });
  const resolvedRememberMe = rememberMe ?? true;
  const session = await createSessionEnvelope(res, {
    userId: user.id,
    rememberMe: resolvedRememberMe,
    tokenVersion: user.tokenVersion
  });

  return res.json({
    ...session,
    employee: {
      id: session.user.id,
      name: [session.user.firstName, session.user.lastName].filter(Boolean).join(" ") || session.user.displayName || "Employee",
      role: session.user.role
    },
  });
}

export async function logout(req: Request, res: Response) {
  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = cookies[refreshCookieName];

  if (refreshToken) {
    try {
      const verifiedRefresh = verifyRefreshToken(refreshToken);
      await revokeAuthSession(verifiedRefresh.sessionId, "logout");
    } catch {
      // Best-effort only. Invalid cookies should still be cleared.
    }
  }

  clearAuthCookies(res);
  return res.json({ ok: true });
}

export async function bootstrapSession(req: Request, res: Response) {
  const restored = await restoreSessionFromRefreshToken(req, res, { includeUser: true });

  if (!restored.ok) {
    return res.json({
      ok: true,
      authenticated: false,
      reason: "reason" in restored.body ? restored.body.reason : null
    });
  }

  return res.json({
    ok: true,
    authenticated: true,
    accessToken: restored.accessToken,
    user: restored.user
  });
}

export async function changePasswordHandler(req: Request, res: Response) {
  const userId = res.locals.user.id as string;
  const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true, tokenVersion: true }
  });

  if (!user?.passwordHash) {
    throw new HttpError(400, { message: "Password is not set for this account." });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, { message: "Current password is incorrect." });
  }

  const nextPasswordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: nextPasswordHash,
      mustResetPassword: false,
      tokenVersion: { increment: 1 }
    }
  });
  await revokeAllAuthSessionsForUser(userId, "password_changed");

  return res.json({ updated: true });
}

export async function refreshAccessToken(req: Request, res: Response) {
  const restored = await restoreSessionFromRefreshToken(req, res);

  if (!restored.ok) {
    return res.status(restored.status).json(restored.body);
  }

  return res.json({
    ok: true,
    accessToken: restored.accessToken
  });
}

export async function whoAmI(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Invalid token" });
  return res.json(await buildSessionUserPayload(userId));
}
