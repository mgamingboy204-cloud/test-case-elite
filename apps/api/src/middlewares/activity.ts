import { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma";

export async function updateLastActive(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    await prisma.user.update({
      where: { id: req.session.userId },
      data: { lastActiveAt: new Date() }
    });
  }
  return next();
}
