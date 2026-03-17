import { Request, Response } from "express";
import { z } from "zod";
import { deactivateAccount, updateNotificationSettings } from "../services/userService";

const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE")
});

const notificationSchema = z.object({
  enabled: z.boolean()
});

export async function deleteMyAccountHandler(req: Request, res: Response) {
  const parsed = deleteAccountSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Please confirm account deletion to continue." });
  }

  await deactivateAccount({ userId: res.locals.user.id });

  return res.json({ deleted: true });
}

export async function updateNotificationsHandler(req: Request, res: Response) {
  const parsed = notificationSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid notification preference payload." });
  }

  const result = await updateNotificationSettings({ userId: res.locals.user.id, enabled: parsed.data.enabled });
  return res.json(result);
}
