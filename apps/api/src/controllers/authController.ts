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
import { createDeviceToken, registerPendingUser, requestOtp, resolveOnboardingStep, validateLogin, verifyOtpAndGetUser } from "../services/authService";
import { HttpError } from "../utils/httpErrors";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";

function issueSession(req: Request, userId: string) {
  req.session.userId = userId;
  return req.sessionID;
}

export async function sendOtp(req: Request, res: Response) {
  const { phone } = req.body as { phone: string };
  await requestOtp(phone);
  return res.json({ ok: true });
}

export async function verifyOtp(req: Request, res: Response) {
  const { phone, code, rememberMe } = req.body as { phone: string; code: string; rememberMe?: boolean };
  try {
    const user = await verifyOtpAndGetUser(phone, code);

    req.session.otpVerifiedPhone = phone;
    issueSession(req, user.id);
    req.session.pendingUserId = undefined;
    req.session.pendingPhone = undefined;

    const resolvedRememberMe = rememberMe ?? req.session.pendingRememberMe ?? false;
    const accessToken = signAccessToken(user.id, { rememberMe: resolvedRememberMe });
    const refreshToken = signRefreshToken(user.id, { rememberMe: resolvedRememberMe });
    const refreshTtlDays = resolvedRememberMe ? env.REFRESH_TOKEN_TTL_DAYS : env.REFRESH_TOKEN_TTL_DAYS_SHORT;
    res.cookie(refreshCookieName, refreshToken, buildRefreshCookieOptions(refreshTtlDays));

    if (req.session.pendingRememberDevice) {
      const { token } = await createDeviceToken(user.id);
      res.cookie(deviceCookieName, token, deviceCookieOptions);
    }
    req.session.pendingRememberDevice = undefined;
    req.session.pendingRememberMe = undefined;

    return res.json({
      ok: true,
      token: accessToken,
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        isAdmin: user.isAdmin,
        onboardingStep: user.onboardingStep,
        videoVerificationStatus: user.videoVerificationStatus,
        paymentStatus: user.paymentStatus
      }
    });
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    return res.status(500).json({ error: "OTP verification failed. Please try again." });
  }
}

export async function register(req: Request, res: Response) {
  const { phone, email, password } = req.body as { phone: string; email?: string; password: string };
  await registerPendingUser({ phone, email, password });
  req.session.pendingPhone = phone;
  return res.json({ phone, otpRequired: true });
}

export async function login(req: Request, res: Response) {
  const { phone, password, rememberDevice, rememberMe } = req.body as {
    phone: string;
    password: string;
    rememberDevice?: boolean;
    rememberMe?: boolean;
  };
  const cookies = parseCookies(req.headers.cookie);
  const deviceToken = cookies[deviceCookieName];

  const result = await validateLogin({ phone, password, deviceToken });
  if (!result.otpRequired) {
    issueSession(req, result.user.id);
    const resolvedRememberMe = rememberMe ?? false;
    const accessToken = signAccessToken(result.user.id, { rememberMe: resolvedRememberMe });
    const refreshToken = signRefreshToken(result.user.id, { rememberMe: resolvedRememberMe });
    const refreshTtlDays = resolvedRememberMe ? env.REFRESH_TOKEN_TTL_DAYS : env.REFRESH_TOKEN_TTL_DAYS_SHORT;
    res.cookie(refreshCookieName, refreshToken, buildRefreshCookieOptions(refreshTtlDays));
    return res.json({
      id: result.user.id,
      phone: result.user.phone,
      status: result.user.status,
      role: result.user.role,
      isAdmin: result.user.isAdmin,
      onboardingStep: result.onboardingStep ?? resolveOnboardingStep(result.user),
      token: accessToken,
      accessToken,
      otpRequired: false
    });
  }

  req.session.pendingUserId = result.user.id;
  req.session.pendingPhone = result.user.phone;
  req.session.pendingRememberDevice = rememberDevice ?? false;
  req.session.pendingRememberMe = rememberMe ?? false;
  return res.json({ otpRequired: true, phone: result.user.phone });
}

export async function logout(req: Request, res: Response) {
  req.session.destroy(() => undefined);
  res.clearCookie(sessionCookieName, sessionCookieOptions);
  res.clearCookie(refreshCookieName, refreshCookieOptions);
  return res.json({ ok: true });
}

export async function refreshAccessToken(req: Request, res: Response) {
  const { refreshToken: refreshTokenFromBody } = (req.body ?? {}) as { refreshToken?: string };
  const cookies = parseCookies(req.headers.cookie);
  const refreshToken = refreshTokenFromBody ?? cookies[refreshCookieName];
  if (!refreshToken) {
    return res.status(401).json({ error: "Missing refresh token" });
  }
  let userId: string;
  let rememberMe = false;
  try {
    const verification = verifyRefreshToken(refreshToken);
    userId = verification.userId;
    rememberMe = verification.rememberMe;
  } catch (error) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(401).json({ error: "Invalid refresh token" });
  }
  if (user.deletedAt) {
    return res.status(403).json({ error: "Account deleted" });
  }
  if (user.deactivatedAt) {
    return res.status(403).json({ error: "Account deactivated" });
  }
  if (user.status === "BANNED") {
    return res.status(403).json({ error: "Banned" });
  }
  const accessToken = signAccessToken(user.id, { rememberMe });
  const nextRefreshToken = signRefreshToken(user.id, { rememberMe });
  const refreshTtlDays = rememberMe ? env.REFRESH_TOKEN_TTL_DAYS : env.REFRESH_TOKEN_TTL_DAYS_SHORT;
  res.cookie(refreshCookieName, nextRefreshToken, buildRefreshCookieOptions(refreshTtlDays));
  return res.json({ accessToken });
}

export async function whoAmI(req: Request, res: Response) {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "Invalid token" });
  }
  const user =
    res.locals.user ??
    (await prisma.user.findUnique({
      where: { id: userId }
    }));
  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
  }
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
    return res.json({ session: { userId: null, otpVerifiedPhone: session.otpVerifiedPhone ?? null } });
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
