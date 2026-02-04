import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

function isMissingNotificationTable(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

export async function listNotifications(userId: string) {
  try {
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
    return { notifications, unreadCount };
  } catch (error) {
    if (isMissingNotificationTable(error)) {
      return { notifications: [], unreadCount: 0 };
    }
    throw error;
  }
}
