import { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma";
import { verifyAccessToken } from "../utils/jwt";

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

  if (isLikesDebugRequest(req)) {
    console.info("likes.auth.entry", {
      marker: "likes_auth_v3",
      requestId,
      hasAuthorizationHeader: Boolean(req.get("authorization"))
    });
  }

  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ message: "Missing or invalid authorization header" });
  }

  let userId: string;
  try {
    userId = verifyAccessToken(token);
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }

  req.user = { id: userId };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(401).json({ message: "Invalid token" });
  }

  if (user.deletedAt) {
    return res.status(403).json({ message: "Account deleted" });
  }
  if (user.deactivatedAt) {
    return res.status(403).json({ message: "Account deactivated" });
  }
  if (user.status === "BANNED") {
    return res.status(403).json({ message: "Banned" });
  }

  res.locals.user = user;

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
