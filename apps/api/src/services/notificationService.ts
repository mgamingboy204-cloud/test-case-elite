import { prisma } from "../db/prisma";

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
  return { notifications, unreadCount };
}
