import { Request, Response } from "express";
import {
  buildRefreshCookieOptions,
  refreshCookieName,
} from "../config/auth";
import { env } from "../config/env";
import { parseCookies } from "../utils/cookies";
import { prisma } from "../db/prisma";
import {
  completeSignupWithPassword,
  issueOnboardingToken,
  registerPendingUser,
  requestSignupOtp,
  requestOtp,
  resolveOnboardingStep,
  validateLogin,
  verifyOtpCodeOnly,
  verifyOtpBypassAndGetUser,
  verifyOtpAndGetUser
} from "../services/authService";
import { ensureUserExecutiveAssignmentAfterOnboarding, validateEmployeeLogin } from "../services/employeeService";
import { HttpError } from "../utils/httpErrors";
import { resolveUserAppState } from "@vael/shared";
import { signAccessToken, signRefreshToken, signSignupToken, verifyRefreshToken, verifySignupToken } from "../utils/jwt";

function buildAccessCookieOptions(ttlMinutes: number) {
  const maxAgeMs = ttlMinutes * 60 * 1000;
  const isProd = env.NODE_ENV === "production";
  // In production we assume cross-site (Vercel web -> Render API) and use modern cookie requirements.
  // If you later serve web+api from the same site, SameSite=None still works (HTTPS required).
  const sameSite = isProd ? ("none" as const) : ("lax" as const);
  const secure = isProd ? true : false;
  return {
    httpOnly: true,
    sameSite,
    secure,
    path: "/",
    maxAge: maxAgeMs
  } as const;
}

function setAuthCookies(
  res: Response,
  options: {
    accessToken: string;
    refreshToken: string;
    refreshTtlDays: number;
  }
) {
  const accessTtlMinutes = env.ACCESS_TOKEN_TTL_MINUTES;
  res.cookie("vael_access_token", options.accessToken, buildAccessCookieOptions(accessTtlMinutes));
  const refreshOptions = buildRefreshCookieOptions(options.refreshTtlDays);
  res.cookie(refreshCookieName, options.refreshToken, refreshOptions);
  return {
    accessCookie: buildAccessCookieOptions(accessTtlMinutes),
    refreshCookie: describeCookieOptions(refreshOptions)
  };
}

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
    const photoCount = await prisma.photo.count({ where: { userId: user.id } });

    const resolvedRememberMe = rememberMe ?? false;

    const accessToken = signAccessToken(user.id, { rememberMe: resolvedRememberMe });
    const refreshToken = signRefreshToken(user.id, { rememberMe: resolvedRememberMe });
    const { onboardingToken } = await issueOnboardingToken(user.id);

    const refreshTtlDays = resolvedRememberMe
      ? env.REFRESH_TOKEN_TTL_DAYS
      : env.REFRESH_TOKEN_TTL_DAYS_SHORT;

    const cookies = setAuthCookies(res, { accessToken, refreshToken, refreshTtlDays });

    logSessionEvent("otp-verified", { userId: user.id });

    return res.json({
      ok: true,
      onboardingToken,
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
        profileCompletedAt: user.profileCompletedAt,
        photoCount
      },
      cookies
    });
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
  const photoCount = await prisma.photo.count({ where: { userId: user.id } });
  const resolvedRememberMe = rememberMe ?? false;
  const accessToken = signAccessToken(user.id, { rememberMe: resolvedRememberMe });
  const refreshToken = signRefreshToken(user.id, { rememberMe: resolvedRememberMe });
  const { onboardingToken } = await issueOnboardingToken(user.id);
  const refreshTtlDays = resolvedRememberMe ? env.REFRESH_TOKEN_TTL_DAYS : env.REFRESH_TOKEN_TTL_DAYS_SHORT;
  const cookies = setAuthCookies(res, { accessToken, refreshToken, refreshTtlDays });

  return res.json({
    ok: true,
    mocked: true,
    onboardingToken,
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
      profileCompletedAt: user.profileCompletedAt,
      photoCount
    },
    cookies
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

  const accessToken = signAccessToken(user.id, { rememberMe: true });
  const refreshToken = signRefreshToken(user.id, { rememberMe: true });
  const { onboardingToken } = await issueOnboardingToken(user.id);
  const cookies = setAuthCookies(res, { accessToken, refreshToken, refreshTtlDays: env.REFRESH_TOKEN_TTL_DAYS });

  return res.json({ ok: true, onboardingToken, accessToken, cookies });
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
  const photoCount = await prisma.photo.count({ where: { userId: result.user.id } });

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
  const { onboardingToken } = await issueOnboardingToken(result.user.id);

  const refreshTtlDays = resolvedRememberMe
    ? env.REFRESH_TOKEN_TTL_DAYS
    : env.REFRESH_TOKEN_TTL_DAYS_SHORT;

  const cookies = setAuthCookies(res, { accessToken, refreshToken, refreshTtlDays });

  logSessionEvent("login", {
    userId: result.user.id,
    rememberMe: resolvedRememberMe,
    refreshTtlDays,
    refreshCookie: cookies.refreshCookie
  });

  return res.json({
    ok: true,
    onboardingToken,
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
      onboardingStep: result.onboardingStep ?? resolveOnboardingStep({ ...result.user, photoCount }),
      videoVerificationStatus: result.user.videoVerificationStatus,
      paymentStatus: result.user.paymentStatus,
      profileCompletedAt: result.user.profileCompletedAt,
      photoCount
    },
    cookies
  });
}

export async function employeeLogin(req: Request, res: Response) {
  const { employeeId, password, rememberMe } = req.body as {
    employeeId: string;
    password: string;
    rememberMe?: boolean;
  };

  const user = await validateEmployeeLogin({ employeeId, password });
  const resolvedRememberMe = rememberMe ?? true;
  const accessToken = signAccessToken(user.id, { rememberMe: resolvedRememberMe });
  const refreshToken = signRefreshToken(user.id, { rememberMe: resolvedRememberMe });
  const refreshTtlDays = resolvedRememberMe ? env.REFRESH_TOKEN_TTL_DAYS : env.REFRESH_TOKEN_TTL_DAYS_SHORT;
  const cookies = setAuthCookies(res, { accessToken, refreshToken, refreshTtlDays });

  return res.json({
    ok: true,
    accessToken,
    user: {
      id: user.id,
      employeeId: user.employeeId,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName
    },
    cookies
  });
}

export async function logout(req: Request, res: Response) {
  // Clear refresh + access cookies
  res.clearCookie(refreshCookieName, buildRefreshCookieOptions(env.REFRESH_TOKEN_TTL_DAYS));
  res.clearCookie("vael_access_token", buildAccessCookieOptions(env.ACCESS_TOKEN_TTL_MINUTES));

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
  const cookieMeta = setAuthCookies(res, { accessToken, refreshToken: nextRefreshToken, refreshTtlDays });

  logSessionEvent("refresh.success", {
    requestId,
    userId: user.id,
    rememberMe,
    refreshTtlDays,
    refreshCookie: cookieMeta.refreshCookie
  });

  return res.json({ ok: true, accessToken });
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

  const [photoCount, profileRecord] = await Promise.all([
    prisma.photo.count({ where: { userId: user.id } }),
    prisma.profile.findUnique({ where: { userId: user.id }, select: { userId: true } })
  ]);
  const resolvedOnboardingStep = resolveOnboardingStep({
    onboardingStep: user.onboardingStep,
    videoVerificationStatus: user.videoVerificationStatus,
    paymentStatus: user.paymentStatus,
    profileCompletedAt: user.profileCompletedAt,
    subscriptionEndsAt: user.subscriptionEndsAt,
    photoCount
  });

  if (resolvedOnboardingStep !== user.onboardingStep) {
    await prisma.user.update({ where: { id: user.id }, data: { onboardingStep: resolvedOnboardingStep } });
  }

  if (resolvedOnboardingStep === "ACTIVE") {
    await ensureUserExecutiveAssignmentAfterOnboarding(user.id);
  }

  const appState = resolveUserAppState({
    isAuthenticated: true,
    onboardingStep: resolvedOnboardingStep,
    videoVerificationStatus: user.videoVerificationStatus,
    paymentStatus: user.paymentStatus,
    profileCompletedAt: user.profileCompletedAt,
    subscriptionEndsAt: user.subscriptionEndsAt,
    userStatus: user.status,
    photoCount,
    hasProfileRecord: Boolean(profileRecord)
  });

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
    onboardingStep: resolvedOnboardingStep,
    videoVerificationStatus: user.videoVerificationStatus,
    paymentStatus: user.paymentStatus,
    profileCompletedAt: user.profileCompletedAt,
    photoCount,
    onboardingToken: user.onboardingToken,
    onboardingTokenExpiresAt: user.onboardingTokenExpiresAt,
    subscriptionStartedAt: user.subscriptionStartedAt,
    subscriptionEndsAt: user.subscriptionEndsAt,
    appState
  });
}
