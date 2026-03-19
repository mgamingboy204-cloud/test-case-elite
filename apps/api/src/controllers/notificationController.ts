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

// ---------------------------------------------------------------------------
// PRD alias endpoints (non-breaking):
// - GET /alerts
// - POST /alerts/read-all
// - POST /alerts/:alertId/read
// These map the existing "notifications" representation to your PRD schema.
// ---------------------------------------------------------------------------

export async function listAlertsHandler(req: Request, res: Response) {
  const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
  const result = await listNotifications(res.locals.user.id, { cursor, limit });

  return res.json({
    alerts: result.notifications.map((n) => ({
      id: n.id,
      type: n.eventType,
      title: n.title,
      body: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt,
      deepLinkUrl: n.deepLinkUrl
    })),
    unreadCount: result.unreadCount
  });
}

export async function markAlertReadHandler(req: Request, res: Response) {
  const { alertId } = req.params as { alertId: string };
  await markNotificationsRead(res.locals.user.id, [alertId]);
  return res.json({ read: true });
}

export async function markAlertsReadAllHandler(req: Request, res: Response) {
  const result = await markNotificationsRead(res.locals.user.id);
  return res.json({ updated: result.updatedCount });
}
