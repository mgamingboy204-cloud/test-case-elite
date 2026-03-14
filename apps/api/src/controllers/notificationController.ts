import { Request, Response } from "express";
import { z } from "zod";
import { listNotifications, markNotificationsRead } from "../services/notificationService";

const markReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional()
});

export async function listNotificationsHandler(req: Request, res: Response) {
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
  const result = await listNotifications(res.locals.user.id, { cursor, limit });
  return res.json(result);
}

export async function markNotificationsReadHandler(req: Request, res: Response) {
  const parsed = markReadSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  const result = await markNotificationsRead(res.locals.user.id, parsed.data.ids);
  return res.json(result);
}
