import { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma";
import { verifyAccessToken } from "../utils/jwt";

const ACTIVITY_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export async function updateLastActive(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.id;

  if (userId) {
    const user = res.locals.user || await prisma.user.findUnique({
      where: { id: userId },
      select: { lastActiveAt: true }
    });

    if (user) {
      const now = new Date();
      const lastActive = new Date(user.lastActiveAt);

      if (now.getTime() - lastActive.getTime() > ACTIVITY_THROTTLE_MS) {
        // Use updateMany with a condition to avoid race conditions and redundant writes
        await prisma.user.update({
          where: { id: userId },
          data: { lastActiveAt: now }
        }).catch(err => {
          console.error("[activity] Failed to update lastActiveAt", err);
        });
      }
    }
  }
  return next();
}
