import { Request, Response } from "express";
import {
  buildClearRefreshCookieOptions,
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

function describeCookieOptions(options: ReturnType<typeof buildRefreshCookieOptions>) {
  return {
    httpOnly: options.httpOnly,
    sameSite: options.sameSite,
    secure: options.secure,
    path: options.path,
    maxAge: options.maxAge
  };
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

    const accessToken = signAccessToken(user.id, { rememberMe: resolvedRememberMe });
    const refreshToken = signRefreshToken(user.id, { rememberMe: resolvedRememberMe });

    const refreshTtlDays = resolvedRememberMe
      ? env.REFRESH_TOKEN_TTL_DAYS
      : env.REFRESH_TOKEN_TTL_DAYS_SHORT;

    res.cookie(refreshCookieName, refreshToken, buildRefreshCookieOptions(refreshTtlDays));

    logSessionEvent("otp-verified", { userId: user.id });

    return res.json({
      ok: true,
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        gender: user.gender,
        role: user.role,
        isAdmin: user.isAdmin,
        status: user.status,
        verifiedAt: user.verifiedAt,
        phoneVerifiedAt: user.phoneVerifiedAt,
        onboardingStep: user.onboardingStep,
        videoVerificationStatus: user.videoVerificationStatus,
        paymentStatus: user.paymentStatus,
        profileCompletedAt: user.profileCompletedAt
      }
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

  return res.json({ ok: true, otpRequired: true });
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

  const accessToken = signAccessToken(result.user.id, { rememberMe: resolvedRememberMe });
  const refreshToken = signRefreshToken(result.user.id, { rememberMe: resolvedRememberMe });

  const refreshTtlDays = resolvedRememberMe
    ? env.REFRESH_TOKEN_TTL_DAYS
    : env.REFRESH_TOKEN_TTL_DAYS_SHORT;

  const refreshCookieOptions = buildRefreshCookieOptions(refreshTtlDays);
  res.cookie(refreshCookieName, refreshToken, refreshCookieOptions);

  logSessionEvent("login", {
    userId: result.user.id,
    rememberMe: resolvedRememberMe,
    refreshTtlDays,
    refreshCookie: describeCookieOptions(refreshCookieOptions)
  });

  return res.json({
    ok: true,
    accessToken,
    user: {
      id: result.user.id,
      phone: result.user.phone,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      displayName: result.user.displayName,
      gender: result.user.gender,
      role: result.user.role,
      isAdmin: result.user.isAdmin,
      status: result.user.status,
      verifiedAt: result.user.verifiedAt,
      phoneVerifiedAt: result.user.phoneVerifiedAt,
      onboardingStep: result.onboardingStep ?? resolveOnboardingStep(result.user),
      videoVerificationStatus: result.user.videoVerificationStatus,
      paymentStatus: result.user.paymentStatus,
      profileCompletedAt: result.user.profileCompletedAt
    }
  });
}

export async function logout(req: Request, res: Response) {
  // Clear refresh cookie
  res.clearCookie(refreshCookieName, buildClearRefreshCookieOptions());

  return res.json({ ok: true });
}

export async function refreshAccessToken(req: Request, res: Response) {
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
    logSessionEvent("refresh.fail", { requestId, reason: "missing_cookie" });
    return res.status(401).json({ message: "Missing refresh token", reason: "missing_cookie" });
  }

  let userId: string;
  let rememberMe = false;

  try {
    const verification = verifyRefreshToken(refreshToken);
    userId = verification.userId;
    rememberMe = verification.rememberMe;
  } catch (error) {
    const reason = getJwtErrorReason(error);
    logSessionEvent("refresh.fail", { requestId, reason });
    return res.status(401).json({ message: "Invalid refresh token", reason });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    logSessionEvent("refresh.fail", { requestId, userId, reason: "invalid_cookie" });
    return res.status(401).json({ message: "Invalid refresh token", reason: "invalid_cookie" });
  }
  if (user.deletedAt) return res.status(403).json({ message: "Account deleted" });
  if (user.deactivatedAt) return res.status(403).json({ message: "Account deactivated" });
  if (user.status === "BANNED") return res.status(403).json({ message: "Banned" });

  const accessToken = signAccessToken(user.id, { rememberMe });
  const nextRefreshToken = signRefreshToken(user.id, { rememberMe });

  const refreshTtlDays = rememberMe ? env.REFRESH_TOKEN_TTL_DAYS : env.REFRESH_TOKEN_TTL_DAYS_SHORT;
  const refreshCookieOptions = buildRefreshCookieOptions(refreshTtlDays);
  res.cookie(refreshCookieName, nextRefreshToken, refreshCookieOptions);

  logSessionEvent("refresh.success", {
    requestId,
    userId: user.id,
    rememberMe,
    refreshTtlDays,
    refreshCookie: describeCookieOptions(refreshCookieOptions)
  });

  return res.json({ ok: true, accessToken });
}

export async function debugCookies(req: Request, res: Response) {
  if (env.NODE_ENV === "production") {
    return res.status(404).json({ message: "Not found" });
  }

  const cookieHeader = req.headers.cookie ?? "";
  const cookies = parseCookies(cookieHeader);
  return res.json({
    ok: true,
    hasCookieHeader: Boolean(cookieHeader),
    includesRefreshCookie: cookieHeader.includes(`${refreshCookieName}=`),
    cookieNames: Object.keys(cookies)
  });
}

export async function whoAmI(req: Request, res: Response) {
  const userId = req.user?.id;
  if (!userId) return res.status(401).json({ message: "Invalid token" });

  const user =
    res.locals.user ??
    (await prisma.user.findUnique({
      where: { id: userId }
    }));

  if (!user) return res.status(401).json({ message: "Invalid token" });

  return res.json({
    id: user.id,
    phone: user.phone,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    gender: user.gender,
    role: user.role,
    isAdmin: user.isAdmin,
    status: user.status,
    verifiedAt: user.verifiedAt,
    phoneVerifiedAt: user.phoneVerifiedAt,
    onboardingStep: user.onboardingStep,
    videoVerificationStatus: user.videoVerificationStatus,
    paymentStatus: user.paymentStatus,
    profileCompletedAt: user.profileCompletedAt
  });
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
