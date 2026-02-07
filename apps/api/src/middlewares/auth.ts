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

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (token === null) {
    return res.status(401).json({ error: "Missing authorization header" });
  }
  if (!token) {
    return res.status(401).json({ error: "Invalid token" });
  }
  let userId: string;
  try {
    userId = verifyAccessToken(token);
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
  req.userId = userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(401).json({ error: "Invalid token" });
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
  res.locals.user = user;
  return next();
}

export function requireApproved(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;
  if (user.status !== "APPROVED") {
    return res.status(403).json({ error: "Approval required" });
  }
  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;
  if (!user.isAdmin && user.role !== "ADMIN") {
    return res.status(403).json({ error: "Admin only" });
  }
  return next();
}

export function requireAuthHeader(req: Request, res: Response, next: NextFunction) {
  const token = getBearerToken(req);
  if (token === null) {
    return res.status(401).json({ error: "Missing authorization header" });
  }
  if (!token) {
    return res.status(401).json({ error: "Invalid token" });
  }
  try {
    req.userId = verifyAccessToken(token);
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
  return next();
}
