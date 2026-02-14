import { Request, Response } from "express";
import {
  AuthLogoutResponseSchema,
  AuthOtpSendResponseSchema,
  AuthRefreshResponseSchema,
  AuthRegisterResponseSchema,
  AuthSuccessSchema,
  SessionUserSchema
} from "@elite/contracts";
import { sendContract } from "../utils/contractResponse";
import {
  buildRefreshCookieOptions,
  deviceCookieName,
  deviceCookieOptions,
  refreshCookieName,
  sessionCookieName,
  sessionCookieOptions
} from "../config/auth";
import { env } from "../config/env";
import { parseCookies } from "../utils/cookies";
import { prisma } from "../db/prisma";
import {
  createDeviceToken,
  registerPendingUser,
  requestOtp,
  resolveOnboardingStep,
  validateLogin,
  verifyOtpAndGetUser
} from "../services/authService";
import { HttpError } from "../utils/httpErrors";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { toUserDTO } from "../serializers/userSerializer";

async function saveSession(req: Request) {
  await new Promise<void>((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function logSessionEvent(event: string, details: Record<string, unknown>) {
  if (env.NODE_ENV !== "production") {
    console.debug(`[auth] ${event}`, details);
  }
}

const THIRTY_DAYS_MS = 1000 * 60 * 60 * 24 * 30;
const SIXTY_DAYS_MS = 1000 * 60 * 60 * 24 * 60;

function applySessionLifetime(
  req: Request,
  options: { rememberDevice30Days?: boolean; rememberMe?: boolean }
) {
  if (options.rememberDevice30Days) {
    req.session.cookie.maxAge = THIRTY_DAYS_MS;
  } else if (options.rememberMe) {
    req.session.cookie.maxAge = SIXTY_DAYS_MS;
  } else {
    req.session.cookie.maxAge = undefined;
    req.session.cookie.expires = undefined;
  }
}

export async function sendOtp(req: Request, res: Response) {
  const { phone } = req.body as { phone: string };
  await requestOtp(phone);
  return sendContract(res, AuthOtpSendResponseSchema, { ok: true });
}

export async function verifyOtp(req: Request, res: Response) {
  const { phone, code, rememberMe } = req.body as {
    phone: string;
    code: string;
    rememberMe?: boolean;
  };

  try {
    const user = await verifyOtpAndGetUser(phone, code);

    req.session.otpVerifiedPhone = phone;
    req.session.userId = user.id;

    applySessionLifetime(req, {
      rememberDevice30Days: req.session.pendingRememberDevice30Days ?? false,
      rememberMe: rememberMe ?? req.session.pendingRememberMe ?? false
    });

    req.session.pendingUserId = undefined;
    req.session.pendingPhone = undefined;

    const resolvedRememberMe = rememberMe ?? req.session.pendingRememberMe ?? false;

    const accessToken = signAccessToken(user.id, { rememberMe: resolvedRememberMe });
    const refreshToken = signRefreshToken(user.id, { rememberMe: resolvedRememberMe });

    const refreshTtlDays = resolvedRememberMe
      ? env.REFRESH_TOKEN_TTL_DAYS
      : env.REFRESH_TOKEN_TTL_DAYS_SHORT;

    res.cookie(refreshCookieName, refreshToken, buildRefreshCookieOptions(refreshTtlDays));

    if (req.session.pendingRememberDevice30Days) {
      const { token } = await createDeviceToken(user.id);
      res.cookie(deviceCookieName, token, deviceCookieOptions);
    }

    req.session.pendingRememberDevice30Days = undefined;
    req.session.pendingRememberMe = undefined;

    await saveSession(req);
    logSessionEvent("otp-verified", { userId: user.id, sessionId: req.sessionID });

    return sendContract(res, AuthSuccessSchema, {
      ok: true,
      accessToken,
      token: accessToken,
      user: toUserDTO({
        ...user,
        onboardingStep: user.onboardingStep ?? resolveOnboardingStep(user)
      })
    });
  } catch (error) {
    if (error instanceof HttpError) throw error;
    return res.status(500).json({ message: "OTP verification failed. Please try again." });
  }
}

export async function register(req: Request, res: Response) {
  const { phone, email, password } = req.body as {
    phone: string;
    email?: string;
    password: string;
  };

  await registerPendingUser({ phone, email, password });
  req.session.pendingPhone = phone;

  await saveSession(req);
  return sendContract(res, AuthRegisterResponseSchema, { ok: true, otpRequired: true });
}

export async function login(req: Request, res: Response) {
  const { phone, password, rememberDevice30Days, rememberDevice, rememberMe } = req.body as {
    phone: string;
    password: string;
    rememberDevice30Days?: boolean;
    rememberDevice?: boolean;
    rememberMe?: boolean;
  };

  const rememberDevice30DaysValue = rememberDevice30Days ?? rememberDevice ?? false;

  const result = await validateLogin({ phone, password });

  if (result.otpRequired) {
    req.session.pendingUserId = result.user.id;
    req.session.pendingPhone = phone;
    req.session.pendingRememberDevice30Days = rememberDevice30DaysValue;
    req.session.pendingRememberMe = rememberMe ?? false;
    await requestOtp(phone);
    await saveSession(req);
    return sendContract(res, AuthRegisterResponseSchema, { ok: true, otpRequired: true });
  }

  applySessionLifetime(req, {
    rememberDevice30Days: rememberDevice30DaysValue,
    rememberMe: rememberMe ?? false
  });

  req.session.userId = result.user.id;

  const resolvedRememberMe = rememberMe ?? false;

  const accessToken = signAccessToken(result.user.id, { rememberMe: resolvedRememberMe });
  const refreshToken = signRefreshToken(result.user.id, { rememberMe: resolvedRememberMe });

  const refreshTtlDays = resolvedRememberMe
    ? env.REFRESH_TOKEN_TTL_DAYS
    : env.REFRESH_TOKEN_TTL_DAYS_SHORT;

  res.cookie(refreshCookieName, refreshToken, buildRefreshCookieOptions(refreshTtlDays));

  logSessionEvent("login", { userId: result.user.id });

  return sendContract(res, AuthSuccessSchema, {
    ok: true,
    accessToken,
    token: accessToken,
    user: toUserDTO({
      ...result.user,
      onboardingStep: result.onboardingStep ?? resolveOnboardingStep(result.user)
    })
  });
}

export async function logout(req: Request, res: Response) {
  req.session.destroy(() => undefined);

  const { maxAge: _sessionMaxAge, ...sessionClearOptions } = sessionCookieOptions;
  const { maxAge: _refreshMaxAge, ...refreshClearOptions } = buildRefreshCookieOptions(env.REFRESH_TOKEN_TTL_DAYS);

  // Clear session cookie
  res.clearCookie(sessionCookieName, sessionClearOptions);

  // Clear refresh cookie (must match options used when setting it)
  res.clearCookie(refreshCookieName, refreshClearOptions);

  return sendContract(res, AuthLogoutResponseSchema, { ok: true });
}

export async function refreshAccessToken(req: Request, res: Response) {
  const { refreshToken: refreshTokenFromBody } = (req.body ?? {}) as { refreshToken?: string };

  const refreshTokenFromCookieParser = (req as Request & { cookies?: Record<string, string | undefined> }).cookies?.[refreshCookieName];
  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = refreshTokenFromBody ?? refreshTokenFromCookieParser ?? cookies[refreshCookieName];

  if (!refreshToken) {
    return res.status(401).json({ message: "Missing refresh token" });
  }

  let userId: string;
  let rememberMe = false;

  try {
    const verification = verifyRefreshToken(refreshToken);
    userId = verification.userId;
    rememberMe = verification.rememberMe;
  } catch {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) return res.status(401).json({ message: "Invalid refresh token" });
  if (user.deletedAt) return res.status(403).json({ message: "Account deleted" });
  if (user.deactivatedAt) return res.status(403).json({ message: "Account deactivated" });
  if (user.status === "BANNED") return res.status(403).json({ message: "Banned" });

  const accessToken = signAccessToken(user.id, { rememberMe });
  const nextRefreshToken = signRefreshToken(user.id, { rememberMe });

  const refreshTtlDays = rememberMe ? env.REFRESH_TOKEN_TTL_DAYS : env.REFRESH_TOKEN_TTL_DAYS_SHORT;
  res.cookie(refreshCookieName, nextRefreshToken, buildRefreshCookieOptions(refreshTtlDays));

  return sendContract(res, AuthRefreshResponseSchema, { ok: true, accessToken, token: accessToken });
}

export async function whoAmI(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ message: "Invalid token" });

  const user =
    res.locals.user ??
    (await prisma.user.findUnique({
      where: { id: userId }
    }));

  if (!user) return res.status(401).json({ message: "Invalid token" });

  return sendContract(res, SessionUserSchema, toUserDTO({
    ...user,
    onboardingStep: user.onboardingStep ?? resolveOnboardingStep(user)
  }));
}

export async function devWhoAmI(req: Request, res: Response) {
  const session = req.session;

  if (!session.userId) {
    return res.json({
      session: {
        userId: null,
        otpVerifiedPhone: session.otpVerifiedPhone ?? null
      }
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, phone: true, role: true }
  });

  return res.json({
    session: {
      userId: session.userId,
      otpVerifiedPhone: session.otpVerifiedPhone ?? null
    },
    user
  });
}
