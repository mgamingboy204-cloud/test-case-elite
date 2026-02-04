import { Request, Response } from "express";
import { listNotifications } from "../services/notificationService";

export async function listNotificationsHandler(req: Request, res: Response) {
  const result = await listNotifications(res.locals.user.id);
  return res.json(result);
}
