import { Request, Response } from "express";
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

function logSessionEvent(event: string, details: Record<string, unknown>) {
  if (env.NODE_ENV !== "production") {
    console.debug(`[auth] ${event}`, details);
  }
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
  const { phone, password, rememberMe } = req.body as {
    phone: string;
    password: string;
    rememberMe?: boolean;
  };

  const result = await validateLogin({ phone, password });

  if (result.otpRequired) {
    await requestOtp(phone);
    return res.json({ ok: true, otpRequired: true });
  }

  const resolvedRememberMe = rememberMe ?? false;

  const accessToken = signAccessToken(result.user.id, { rememberMe: resolvedRememberMe });
  const refreshToken = signRefreshToken(result.user.id, { rememberMe: resolvedRememberMe });

  const refreshTtlDays = resolvedRememberMe
    ? env.REFRESH_TOKEN_TTL_DAYS
    : env.REFRESH_TOKEN_TTL_DAYS_SHORT;

  res.cookie(refreshCookieName, refreshToken, buildRefreshCookieOptions(refreshTtlDays));

  logSessionEvent("login", { userId: result.user.id });

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
  res.clearCookie(refreshCookieName, buildRefreshCookieOptions(env.REFRESH_TOKEN_TTL_DAYS));

  return res.json({ ok: true });
}

export async function refreshAccessToken(req: Request, res: Response) {
  const { refreshToken: refreshTokenFromBody } = (req.body ?? {}) as { refreshToken?: string };

  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = refreshTokenFromBody ?? cookies[refreshCookieName];

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

  return res.json({ ok: true, accessToken });
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
