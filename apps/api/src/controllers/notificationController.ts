import { Request, Response } from "express";
import { listNotifications, markNotificationRead } from "../services/notificationService";

export async function listNotificationsHandler(req: Request, res: Response) {
  const result = await listNotifications(req.user!.id);
  return res.json(result);
}

export async function markNotificationReadHandler(req: Request, res: Response) {
  const { notificationId } = req.params as { notificationId: string };
  const result = await markNotificationRead({ userId: req.user!.id, notificationId });
  return res.json(result);
}
