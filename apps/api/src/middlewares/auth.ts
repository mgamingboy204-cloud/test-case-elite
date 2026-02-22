import { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma";
import { verifyAccessToken } from "../utils/jwt";
import { logger } from "../utils/logger";

function getBearerToken(req: Request) {
  const header = req.get("authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match || !match[1]) return "";
  return match[1].trim();
}

function isLikesDebugRequest(req: Request) {
  return process.env.LIKES_DEBUG_LOGS === "1" && req.path === "/likes" && req.method === "POST";
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const requestId = (res.locals.requestId as string | undefined) ?? req.get("x-request-id") ?? "unknown";
  const hasAuthorizationHeader = Boolean(req.get("authorization"));

  logger.info("auth.check", { requestId, path: req.path, method: req.method, hasAuthHeader: hasAuthorizationHeader });

  if (isLikesDebugRequest(req)) {
    console.info("likes.auth.entry", {
      marker: "likes_auth_v3",
      requestId,
      hasAuthorizationHeader
    });
  }

  const token = getBearerToken(req);
  if (!token) {
    logger.warn("auth.resolve", { requestId, path: req.path, result: "fail", reason: "missing_authorization_header" });
    return res.status(401).json({ message: "Missing or invalid authorization header" });
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

  res.locals.user = user;
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

export const requireAuthHeader = requireAuth;

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
