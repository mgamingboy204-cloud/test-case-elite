import { Request, Response } from "express";
import { z } from "zod";
import { deactivateAccount } from "../services/userService";
import { prisma } from "../db/prisma";

const deleteAccountSchema = z.object({
  confirmation: z.enum(["DELETE_MY_ACCOUNT", "DELETE"]),
  reason: z.string().trim().max(240).optional()
});

export async function deleteMyAccountHandler(req: Request, res: Response) {
  const parsed = deleteAccountSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Please confirm account deletion to continue." });
  }

  const result = await deactivateAccount({
    userId: res.locals.user.id,
    reason: parsed.data.reason
  });

  return res.json({ deleted: true, ...result });
}

const fcmTokenSchema = z.object({
  token: z.string().min(10).max(2048)
});

export async function upsertFcmTokenHandler(req: Request, res: Response) {
  const parsed = fcmTokenSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid token" });
  }

  const token = parsed.data.token;
  const now = new Date();
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  const userId = res.locals.user.id;

  // NOTE: We store the provided registration token in `tokenHash`.
  // This keeps the schema unchanged and enables push sending immediately.
  // If you later need device-token hashing/verification, we can add a new column and migrate.
  await prisma.deviceToken.upsert({
    where: { tokenHash: token },
    update: { userId, expiresAt, lastUsedAt: now },
    create: { userId, tokenHash: token, expiresAt, lastUsedAt: now }
  });

  return res.json({ ok: true });
}
