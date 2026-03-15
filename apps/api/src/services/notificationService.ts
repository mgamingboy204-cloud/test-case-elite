import { NotificationType } from "@prisma/client";
import { prisma } from "../db/prisma";

const ALERT_DEEP_LINKS: Record<NotificationType, string> = {
  NEW_LIKE: "/likes",
  NEW_MATCH: "/matches",
  NEW_MESSAGE: "/matches",
  SYSTEM_PROMO: "/discover",
  PROFILE_VIEW: "/profile",
  VIDEO_VERIFICATION_UPDATE: "/onboarding/verification",
  OFFLINE_MEET_REQUEST: "/matches",
  OFFLINE_MEET_ACCEPTED: "/matches",
  OFFLINE_MEET_OPTIONS_SENT: "/matches",
  OFFLINE_MEET_TIMEOUT: "/matches",
  OFFLINE_MEET_NO_OVERLAP: "/matches",
  OFFLINE_MEET_FINALIZED: "/matches",
  OFFLINE_MEET_RESCHEDULE_UPDATE: "/matches"
};

const ALERT_TITLES: Record<NotificationType, string> = {
  NEW_LIKE: "New Interest",
  NEW_MATCH: "New Match",
  NEW_MESSAGE: "New Message",
  SYSTEM_PROMO: "Elite Update",
  PROFILE_VIEW: "Profile View",
  VIDEO_VERIFICATION_UPDATE: "Verification Update",
  OFFLINE_MEET_REQUEST: "Offline Meet Request",
  OFFLINE_MEET_ACCEPTED: "Offline Meet Approved",
  OFFLINE_MEET_OPTIONS_SENT: "Offline Meet Options",
  OFFLINE_MEET_TIMEOUT: "Offline Meet Timeout",
  OFFLINE_MEET_NO_OVERLAP: "Offline Meet Not Compatible",
  OFFLINE_MEET_FINALIZED: "Offline Meet Finalized",
  OFFLINE_MEET_RESCHEDULE_UPDATE: "Offline Meet Update"
};

const ALERT_MESSAGES: Record<NotificationType, string> = {
  NEW_LIKE: "A member showed interest in your profile.",
  NEW_MATCH: "A new match is waiting for your move.",
  NEW_MESSAGE: "You received a new message.",
  SYSTEM_PROMO: "A new offer is available for your account.",
  PROFILE_VIEW: "Someone recently viewed your profile.",
  VIDEO_VERIFICATION_UPDATE: "Your verification status has changed.",
  OFFLINE_MEET_REQUEST: "Your match requested an offline meet.",
  OFFLINE_MEET_ACCEPTED: "Both members accepted. Concierge will coordinate.",
  OFFLINE_MEET_OPTIONS_SENT: "Review concierge options and submit your preferences.",
  OFFLINE_MEET_TIMEOUT: "The previous coordination timed out.",
  OFFLINE_MEET_NO_OVERLAP: "No overlap found. You can retry later.",
  OFFLINE_MEET_FINALIZED: "Your offline meet has been scheduled.",
  OFFLINE_MEET_RESCHEDULE_UPDATE: "There is an update on your offline meet coordination."
};

export async function listNotifications(userId: string, options?: { cursor?: string; limit?: number }) {
  const take = Math.min(Math.max(options?.limit ?? 20, 1), 50);

  const notifications = await prisma.notification.findMany({
    where: { userId },
    ...(options?.cursor
      ? {
          cursor: { id: options.cursor },
          skip: 1
        }
      : {}),
    take,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      actor: {
        select: {
          id: true,
          profile: true,
          photos: { select: { id: true, url: true, photoIndex: true }, orderBy: [{ photoIndex: "asc" }, { createdAt: "asc" }] }
        }
      }
    }
  });

  const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });

  const mapped = notifications.map((item) => ({
    id: item.id,
    type: item.type,
    isRead: item.isRead,
    createdAt: item.createdAt,
    readAt: item.readAt,
    title: item.title ?? ALERT_TITLES[item.type],
    message: item.message ?? ALERT_MESSAGES[item.type],
    deepLinkUrl: item.deepLinkUrl ?? ALERT_DEEP_LINKS[item.type],
    imageUrl: item.imageUrl ?? item.actor?.photos[0]?.url ?? null,
    actor: item.actor
      ? {
          id: item.actor.id,
          profile: item.actor.profile,
          photos: item.actor.photos
        }
      : null,
    metadata: item.metadata
  }));

  return {
    notifications: mapped,
    unreadCount,
    pageInfo: {
      nextCursor: notifications.length === take ? notifications[notifications.length - 1]?.id ?? null : null,
      hasMore: notifications.length === take
    }
  };
}

export async function markNotificationsRead(userId: string, notificationIds?: string[]) {
  const whereClause = notificationIds?.length
    ? {
        userId,
        id: { in: notificationIds }
      }
    : { userId, isRead: false };

  const now = new Date();
  const result = await prisma.notification.updateMany({
    where: whereClause,
    data: {
      isRead: true,
      readAt: now
    }
  });

  const unreadCount = await prisma.notification.count({ where: { userId, isRead: false } });
  return { updatedCount: result.count, unreadCount };
}
