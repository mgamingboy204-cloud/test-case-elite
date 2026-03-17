import { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma";
import { verifyAccessToken } from "../utils/jwt";
import { logger } from "../utils/logger";
import { parseCookies } from "../utils/cookies";

function getAccessToken(req: Request) {
  const authHeader = req.get("authorization") ?? req.get("Authorization") ?? "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    if (bearerToken) return bearerToken;
  }

  const cookieHeader = req.headers.cookie ?? "";
  if (!cookieHeader) return null;
  const cookies = parseCookies(cookieHeader);
  const token = cookies["vael_access_token"];
  if (!token) return null;
  return token.trim();
}

function isLikesDebugRequest(req: Request) {
  return process.env.LIKES_DEBUG_LOGS === "1" && req.path === "/likes" && req.method === "POST";
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const requestId = (res.locals.requestId as string | undefined) ?? req.get("x-request-id") ?? "unknown";
  const hasCookieHeader = Boolean(req.headers.cookie);
  const hasAuthorizationHeader = Boolean(req.get("authorization") ?? req.get("Authorization"));

  logger.info("auth.check", {
    requestId,
    path: req.path,
    method: req.method,
    hasCookieHeader,
    hasAuthorizationHeader
  });

  if (isLikesDebugRequest(req)) {
    console.info("likes.auth.entry", {
      marker: "likes_auth_v3",
      requestId,
      hasCookieHeader
    });
  }

  const token = getAccessToken(req);
  if (!token) {
    logger.warn("auth.resolve", { requestId, path: req.path, result: "fail", reason: "missing_auth" });
    return res.status(401).json({ message: "Authentication required" });
  }

  let userId: string;
  try {
    userId = verifyAccessToken(token);
  } catch (error) {
    logger.warn("auth.resolve", { requestId, path: req.path, result: "fail", reason: "invalid_token" });
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = { id: userId };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    logger.warn("auth.resolve", { requestId, path: req.path, result: "fail", reason: "user_not_found" });
    return res.status(401).json({ message: "Invalid token" });
  }

  if (user.deletedAt) {
    logger.warn("auth.resolve", { requestId, path: req.path, result: "fail", reason: "account_deleted" });
    return res.status(403).json({ message: "Account deleted" });
  }
  if (user.deactivatedAt) {
    logger.warn("auth.resolve", { requestId, path: req.path, result: "fail", reason: "account_deactivated" });
    return res.status(403).json({ message: "Account deactivated" });
  }
  if (user.status === "BANNED") {
    logger.warn("auth.resolve", { requestId, path: req.path, result: "fail", reason: "banned" });
    return res.status(403).json({ message: "Banned" });
  }

  let photoCount = 0;
  if (typeof prisma.photo?.count === "function") {
    try {
      photoCount = await prisma.photo.count({ where: { userId: user.id } });
    } catch (error) {
      logger.warn("auth.photo_count_failed", {
        requestId,
        path: req.path,
        userId,
        reason: error instanceof Error ? error.message : "unknown"
      });
    }
  }
  res.locals.user = { ...user, photoCount };
  logger.info("auth.resolve", { requestId, path: req.path, result: "success", userId });

  if (isLikesDebugRequest(req)) {
    console.info("likes.auth.resolved", {
      marker: "likes_auth_v3",
      requestId,
      resolvedUserId: userId
    });
  }

  return next();
}


export function requireOnboardingTokenMatch(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;
  if (!user) {
    return res.status(401).json({ message: "Invalid token" });
  }
  if (user.onboardingStep === "ACTIVE") {
    return next();
  }
  if (!user.onboardingToken) {
    return res.status(401).json({ message: "Onboarding token missing" });
  }
  if (user.onboardingTokenExpiresAt && user.onboardingTokenExpiresAt.getTime() < Date.now()) {
    return res.status(401).json({ message: "Onboarding token expired" });
  }
  return next();
}

export function requireApproved(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;
  if (!user || user.status !== "APPROVED") {
    return res.status(403).json({ message: "Approval required" });
  }
  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;
  if (!user || (!user.isAdmin && user.role !== "ADMIN")) {
    return res.status(403).json({ message: "Admin only" });
  }
  return next();
}

export function requireEmployee(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;
  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (user.role !== "EMPLOYEE" && user.role !== "ADMIN") {
    return res.status(403).json({ message: "Employee access required" });
  }
  return next();
}
