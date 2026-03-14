import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

function deriveTargetRoute(type: string) {
  if (type === "NEW_LIKE") return "/likes";
  if (type === "NEW_MATCH") return "/matches";
  return "/alerts";
}

function deriveEventCategory(type: string) {
  if (type === "NEW_LIKE") return "LIKE";
  if (type === "NEW_MATCH") return "MATCH";
  return "SYSTEM";
}

function deriveEventMessage(type: string, actorName: string) {
  if (type === "NEW_LIKE") return `${actorName} liked you`;
  if (type === "NEW_MATCH") return `${actorName} matched with you`;
  if (type === "VIDEO_VERIFICATION_UPDATE") return "Your profile is now verified";
  return "New account activity";
}

export async function listNotifications(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            profile: true,
            photos: { select: { url: true }, orderBy: { createdAt: "asc" } }
          }
        },
        match: {
          select: {
            id: true,
            createdAt: true,
            userA: { select: { id: true, profile: true, photos: { select: { url: true } } } },
            userB: { select: { id: true, profile: true, photos: { select: { url: true } } } }
          }
        }
      }
    }),
    prisma.notification.count({ where: { userId, isRead: false } })
  ]);

  const mapped = notifications.map((notification) => {
    const actorName = notification.actor?.profile?.name ?? "Someone";
    const actorImageUrl = notification.actor?.photos[0]?.url ?? null;

    return {
      ...notification,
      eventCategory: deriveEventCategory(notification.type),
      eventMessage: deriveEventMessage(notification.type, actorName),
      targetRoute: deriveTargetRoute(notification.type),
      actorPreview: {
        actorName,
        actorImageUrl
      }
    };
  });

  return { notifications: mapped, unreadCount };
}

export async function markNotificationRead(options: { userId: string; notificationId: string }) {
  const notification = await prisma.notification.findFirst({
    where: {
      id: options.notificationId,
      userId: options.userId
    }
  });

  if (!notification) {
    throw new HttpError(404, { message: "Notification not found" });
  }

  if (notification.isRead) {
    return { ok: true, notificationId: notification.id, isRead: true };
  }

  await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true }
  });

  return { ok: true, notificationId: notification.id, isRead: true };
}
