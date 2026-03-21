import { Response } from "express";
import { resolveUserAppState } from "@vael/shared";
import { env } from "../config/env";
import { buildRefreshCookieOptions, refreshCookieName } from "../config/auth";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";
import { signAccessToken, signRefreshToken } from "../utils/jwt";
import { ensureUserExecutiveAssignmentAfterOnboarding } from "./employeeService";
import { issueOnboardingToken, resolveOnboardingStep } from "./authService";

const LEGACY_ACCESS_COOKIE_NAME = "vael_access_token";

function buildLegacyAccessCookieOptions() {
  const sameSite = env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const);
  const secure = env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite,
    secure,
    path: "/"
  } as const;
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

function resolveRefreshTtlDays(rememberMe: boolean) {
  return rememberMe ? env.REFRESH_TOKEN_TTL_DAYS : env.REFRESH_TOKEN_TTL_DAYS_SHORT;
}

function resolveAuthSessionExpiry(rememberMe: boolean) {
  return new Date(Date.now() + resolveRefreshTtlDays(rememberMe) * 24 * 60 * 60 * 1000);
}

async function ensureOnboardingAccess(user: {
  id: string;
  onboardingStep?: string | null;
  onboardingToken?: string | null;
  onboardingTokenExpiresAt?: Date | null;
}) {
  if (user.onboardingStep === "ACTIVE") {
    return {
      onboardingToken: user.onboardingToken ?? null,
      onboardingTokenExpiresAt: user.onboardingTokenExpiresAt ?? null
    };
  }

  const expiresAt = user.onboardingTokenExpiresAt?.getTime() ?? 0;
  const hasValidOnboardingToken = Boolean(user.onboardingToken) && expiresAt > Date.now();
  if (hasValidOnboardingToken) {
    return {
      onboardingToken: user.onboardingToken ?? null,
      onboardingTokenExpiresAt: user.onboardingTokenExpiresAt ?? null
    };
  }

  return issueOnboardingToken(user.id);
}

function assertSessionEligible(user: {
  deletedAt?: Date | null;
  deactivatedAt?: Date | null;
  status?: string | null;
}) {
  if (user.deletedAt) {
    throw new HttpError(403, { message: "Account deleted" });
  }
  if (user.deactivatedAt) {
    throw new HttpError(403, { message: "Account deactivated" });
  }
  if (user.status === "BANNED") {
    throw new HttpError(403, { message: "Banned" });
  }
}

export type SessionUserPayload = {
  id: string;
  phone: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  gender: string | null;
  role: string;
  isAdmin: boolean;
  mustResetPassword: boolean;
  status: string;
  verifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  onboardingStep: string;
  videoVerificationStatus: string;
  paymentStatus: string;
  profileCompletedAt: Date | null;
  photoCount: number;
  onboardingToken: string | null;
  onboardingTokenExpiresAt: Date | null;
  subscriptionStartedAt: Date | null;
  subscriptionEndsAt: Date | null;
  appState: ReturnType<typeof resolveUserAppState>;
};

export async function buildSessionUserPayload(userId: string): Promise<SessionUserPayload> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(401, { message: "Invalid token" });
  }

  assertSessionEligible(user);

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

  let nextUser = user;
  if (resolvedOnboardingStep !== user.onboardingStep) {
    nextUser = await prisma.user.update({
      where: { id: user.id },
      data: { onboardingStep: resolvedOnboardingStep }
    });
  }

  if (resolvedOnboardingStep === "ACTIVE") {
    await ensureUserExecutiveAssignmentAfterOnboarding(nextUser.id);
  }

  const onboardingAccess = await ensureOnboardingAccess({
    ...nextUser,
    onboardingStep: resolvedOnboardingStep
  });

  const appState = resolveUserAppState({
    isAuthenticated: true,
    onboardingStep: resolvedOnboardingStep,
    videoVerificationStatus: nextUser.videoVerificationStatus,
    paymentStatus: nextUser.paymentStatus,
    profileCompletedAt: nextUser.profileCompletedAt,
    subscriptionEndsAt: nextUser.subscriptionEndsAt,
    userStatus: nextUser.status,
    photoCount,
    hasProfileRecord: Boolean(profileRecord)
  });

  return {
    id: nextUser.id,
    phone: nextUser.phone,
    email: nextUser.email,
    firstName: nextUser.firstName,
    lastName: nextUser.lastName,
    displayName: nextUser.displayName,
    gender: nextUser.gender,
    role: nextUser.role,
    isAdmin: nextUser.isAdmin,
    mustResetPassword: nextUser.mustResetPassword,
    status: nextUser.status,
    verifiedAt: nextUser.verifiedAt,
    phoneVerifiedAt: nextUser.phoneVerifiedAt,
    onboardingStep: resolvedOnboardingStep,
    videoVerificationStatus: nextUser.videoVerificationStatus,
    paymentStatus: nextUser.paymentStatus,
    profileCompletedAt: nextUser.profileCompletedAt,
    photoCount,
    onboardingToken: onboardingAccess.onboardingToken ?? null,
    onboardingTokenExpiresAt: onboardingAccess.onboardingTokenExpiresAt ?? null,
    subscriptionStartedAt: nextUser.subscriptionStartedAt,
    subscriptionEndsAt: nextUser.subscriptionEndsAt,
    appState
  };
}

export function clearAuthCookies(res: Response) {
  const { maxAge: _refreshMaxAge, ...refreshCookieOptions } = buildRefreshCookieOptions(env.REFRESH_TOKEN_TTL_DAYS);
  res.clearCookie(refreshCookieName, refreshCookieOptions);
  res.clearCookie(LEGACY_ACCESS_COOKIE_NAME, buildLegacyAccessCookieOptions());
}

export async function createAuthSessionRecord(options: { userId: string; rememberMe: boolean }) {
  return prisma.authSession.create({
    data: {
      userId: options.userId,
      rememberMe: options.rememberMe,
      expiresAt: resolveAuthSessionExpiry(options.rememberMe),
      lastUsedAt: new Date()
    }
  });
}

export async function getActiveAuthSession(sessionId: string) {
  const session = await prisma.authSession.findUnique({ where: { id: sessionId } });
  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() <= Date.now()) return null;
  return session;
}

export async function touchAuthSession(sessionId: string, rememberMe: boolean) {
  return prisma.authSession.update({
    where: { id: sessionId },
    data: {
      rememberMe,
      expiresAt: resolveAuthSessionExpiry(rememberMe),
      lastUsedAt: new Date()
    }
  });
}

export async function revokeAuthSession(sessionId: string, reason: string) {
  await prisma.authSession.updateMany({
    where: {
      id: sessionId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date(),
      revokeReason: reason
    }
  });
}

export async function revokeAllAuthSessionsForUser(userId: string, reason: string) {
  await prisma.authSession.updateMany({
    where: {
      userId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date(),
      revokeReason: reason
    }
  });
}

export function issueSessionTokens(
  res: Response,
  options: {
    userId: string;
    rememberMe: boolean;
    tokenVersion: number;
    sessionId: string;
  }
) {
  const accessToken = signAccessToken(options.userId, {
    rememberMe: options.rememberMe,
    tokenVersion: options.tokenVersion
  });
  const refreshToken = signRefreshToken(options.userId, {
    rememberMe: options.rememberMe,
    tokenVersion: options.tokenVersion,
    sessionId: options.sessionId
  });
  const refreshTtlDays = resolveRefreshTtlDays(options.rememberMe);
  const refreshOptions = buildRefreshCookieOptions(refreshTtlDays);

  res.cookie(refreshCookieName, refreshToken, refreshOptions);
  res.clearCookie(LEGACY_ACCESS_COOKIE_NAME, buildLegacyAccessCookieOptions());

  return {
    accessToken,
    refreshTtlDays,
    refreshCookie: describeCookieOptions(refreshOptions)
  };
}

export async function createSessionEnvelope(
  res: Response,
  options: {
    userId: string;
    rememberMe: boolean;
    tokenVersion: number;
    sessionId?: string;
  }
) {
  const user = await buildSessionUserPayload(options.userId);
  const sessionRecord = options.sessionId
    ? await touchAuthSession(options.sessionId, options.rememberMe)
    : await createAuthSessionRecord({
        userId: options.userId,
        rememberMe: options.rememberMe
      });
  const session = issueSessionTokens(res, {
    ...options,
    sessionId: sessionRecord.id
  });

  return {
    ok: true as const,
    accessToken: session.accessToken,
    user,
    sessionId: sessionRecord.id,
    cookies: {
      refreshCookie: session.refreshCookie
    }
  };
}
