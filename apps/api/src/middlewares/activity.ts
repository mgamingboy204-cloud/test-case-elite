import { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma";
import { verifyAccessToken } from "../utils/jwt";

export async function updateLastActive(req: Request, res: Response, next: NextFunction) {
  const header = req.get("authorization");
  let userId = req.session.userId;
  if (!userId && header) {
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) {
      try {
        userId = verifyAccessToken(match[1].trim());
      } catch (error) {
        userId = undefined;
      }
    }
  }
  if (userId) {
    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() }
    });
  }
  return next();
}
