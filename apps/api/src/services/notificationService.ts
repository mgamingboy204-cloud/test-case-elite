import { NotificationType } from "@prisma/client";
import { prisma } from "../db/prisma";

type ProductAlertType =
  | "LIKE_RECEIVED"
  | "MATCH_CREATED"
  | "INTERACTION_REQUEST_RECEIVED"
  | "INTERACTION_REQUEST_ACCEPTED"
  | "INTERACTION_REQUEST_REJECTED"
  | "OFFLINE_MEET_OPTIONS_SENT"
  | "OFFLINE_MEET_TIMEOUT"
  | "OFFLINE_MEET_NO_OVERLAP"
  | "OFFLINE_MEET_FINALIZED"
  | "ONLINE_MEET_OPTIONS_SENT"
  | "ONLINE_MEET_TIMEOUT"
  | "ONLINE_MEET_NO_OVERLAP"
  | "ONLINE_MEET_FINALIZED"
  | "SOCIAL_EXCHANGE_REQUEST"
  | "SOCIAL_EXCHANGE_READY"
  | "SOCIAL_EXCHANGE_EXPIRED"
  | "PHONE_EXCHANGE_REQUEST"
  | "PHONE_EXCHANGE_CONFIRMED"
  | "VERIFICATION_ASSIGNED"
  | "VERIFICATION_APPROVED"
  | "VERIFICATION_REJECTED"
  | "PAYMENT_ISSUE"
  | "MEMBERSHIP_UPDATE";

const PRODUCT_ALERT_TYPE_MAP: Record<NotificationType, ProductAlertType> = {
  NEW_LIKE: "LIKE_RECEIVED",
  NEW_MATCH: "MATCH_CREATED",
  NEW_MESSAGE: "MEMBERSHIP_UPDATE",
  SYSTEM_PROMO: "MEMBERSHIP_UPDATE",
  PROFILE_VIEW: "MEMBERSHIP_UPDATE",
  VIDEO_VERIFICATION_UPDATE: "MEMBERSHIP_UPDATE",
  OFFLINE_MEET_REQUEST: "INTERACTION_REQUEST_RECEIVED",
  OFFLINE_MEET_ACCEPTED: "INTERACTION_REQUEST_ACCEPTED",
  OFFLINE_MEET_OPTIONS_SENT: "OFFLINE_MEET_OPTIONS_SENT",
  OFFLINE_MEET_TIMEOUT: "OFFLINE_MEET_TIMEOUT",
  OFFLINE_MEET_NO_OVERLAP: "OFFLINE_MEET_NO_OVERLAP",
  OFFLINE_MEET_FINALIZED: "OFFLINE_MEET_FINALIZED",
  OFFLINE_MEET_RESCHEDULE_UPDATE: "MEMBERSHIP_UPDATE",
  ONLINE_MEET_REQUEST: "INTERACTION_REQUEST_RECEIVED",
  ONLINE_MEET_ACCEPTED: "INTERACTION_REQUEST_ACCEPTED",
  ONLINE_MEET_OPTIONS_SENT: "ONLINE_MEET_OPTIONS_SENT",
  ONLINE_MEET_TIMEOUT: "ONLINE_MEET_TIMEOUT",
  ONLINE_MEET_NO_OVERLAP: "ONLINE_MEET_NO_OVERLAP",
  ONLINE_MEET_FINALIZED: "ONLINE_MEET_FINALIZED",
  ONLINE_MEET_RESCHEDULE_UPDATE: "MEMBERSHIP_UPDATE",
  SOCIAL_EXCHANGE_REQUEST: "SOCIAL_EXCHANGE_REQUEST",
  SOCIAL_EXCHANGE_ACCEPTED: "INTERACTION_REQUEST_ACCEPTED",
  SOCIAL_EXCHANGE_REJECTED: "INTERACTION_REQUEST_REJECTED",
  SOCIAL_EXCHANGE_HANDLE_READY: "SOCIAL_EXCHANGE_READY",
  SOCIAL_EXCHANGE_VIEWED: "MEMBERSHIP_UPDATE",
  SOCIAL_EXCHANGE_EXPIRED: "SOCIAL_EXCHANGE_EXPIRED",
  SOCIAL_EXCHANGE_RESEND_AVAILABLE: "MEMBERSHIP_UPDATE",
  PHONE_EXCHANGE_REQUEST: "PHONE_EXCHANGE_REQUEST",
  PHONE_EXCHANGE_ACCEPTED: "INTERACTION_REQUEST_ACCEPTED",
  PHONE_EXCHANGE_REJECTED: "INTERACTION_REQUEST_REJECTED",
  PHONE_EXCHANGE_MUTUAL_CONSENT_CONFIRMED: "PHONE_EXCHANGE_CONFIRMED",
  PHONE_EXCHANGE_REVEALED: "MEMBERSHIP_UPDATE"
};

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
  OFFLINE_MEET_RESCHEDULE_UPDATE: "/matches",
  ONLINE_MEET_REQUEST: "/matches",
  ONLINE_MEET_ACCEPTED: "/matches",
  ONLINE_MEET_OPTIONS_SENT: "/matches",
  ONLINE_MEET_TIMEOUT: "/matches",
  ONLINE_MEET_NO_OVERLAP: "/matches",
  ONLINE_MEET_FINALIZED: "/matches",
  ONLINE_MEET_RESCHEDULE_UPDATE: "/matches",
  SOCIAL_EXCHANGE_REQUEST: "/matches",
  SOCIAL_EXCHANGE_ACCEPTED: "/matches",
  SOCIAL_EXCHANGE_REJECTED: "/matches",
  SOCIAL_EXCHANGE_HANDLE_READY: "/matches",
  SOCIAL_EXCHANGE_VIEWED: "/matches",
  SOCIAL_EXCHANGE_EXPIRED: "/matches",
  SOCIAL_EXCHANGE_RESEND_AVAILABLE: "/matches",
  PHONE_EXCHANGE_REQUEST: "/matches",
  PHONE_EXCHANGE_ACCEPTED: "/matches",
  PHONE_EXCHANGE_REJECTED: "/matches",
  PHONE_EXCHANGE_MUTUAL_CONSENT_CONFIRMED: "/matches",
  PHONE_EXCHANGE_REVEALED: "/matches"
};

const ALERT_TITLES: Record<NotificationType, string> = {
  NEW_LIKE: "New Interest",
  NEW_MATCH: "New Match",
  NEW_MESSAGE: "New Message",
  SYSTEM_PROMO: "VAEL Update",
  PROFILE_VIEW: "Profile View",
  VIDEO_VERIFICATION_UPDATE: "Verification Update",
  OFFLINE_MEET_REQUEST: "Offline Meet Request",
  OFFLINE_MEET_ACCEPTED: "Offline Meet Approved",
  OFFLINE_MEET_OPTIONS_SENT: "Offline Meet Options",
  OFFLINE_MEET_TIMEOUT: "Offline Meet Timeout",
  OFFLINE_MEET_NO_OVERLAP: "Offline Meet Not Compatible",
  OFFLINE_MEET_FINALIZED: "Offline Meet Finalized",
  OFFLINE_MEET_RESCHEDULE_UPDATE: "Offline Meet Update",
  ONLINE_MEET_REQUEST: "Online Meet Request",
  ONLINE_MEET_ACCEPTED: "Online Meet Approved",
  ONLINE_MEET_OPTIONS_SENT: "Online Meet Options",
  ONLINE_MEET_TIMEOUT: "Online Meet Timeout",
  ONLINE_MEET_NO_OVERLAP: "Online Meet Not Compatible",
  ONLINE_MEET_FINALIZED: "Online Meet Finalized",
  ONLINE_MEET_RESCHEDULE_UPDATE: "Online Meet Update",
  SOCIAL_EXCHANGE_REQUEST: "Social Exchange Request",
  SOCIAL_EXCHANGE_ACCEPTED: "Social Exchange Accepted",
  SOCIAL_EXCHANGE_REJECTED: "Social Exchange Declined",
  SOCIAL_EXCHANGE_HANDLE_READY: "Handle Ready to Reveal",
  SOCIAL_EXCHANGE_VIEWED: "Handle Revealed",
  SOCIAL_EXCHANGE_EXPIRED: "Handle Expired",
  SOCIAL_EXCHANGE_RESEND_AVAILABLE: "Social Exchange Available",
  PHONE_EXCHANGE_REQUEST: "Phone Exchange Request",
  PHONE_EXCHANGE_ACCEPTED: "Phone Exchange Accepted",
  PHONE_EXCHANGE_REJECTED: "Phone Exchange Declined",
  PHONE_EXCHANGE_MUTUAL_CONSENT_CONFIRMED: "Phone Exchange Confirmed",
  PHONE_EXCHANGE_REVEALED: "Phone Numbers Viewed"
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
  OFFLINE_MEET_RESCHEDULE_UPDATE: "There is an update on your offline meet coordination.",
  ONLINE_MEET_REQUEST: "Your match requested an online meet.",
  ONLINE_MEET_ACCEPTED: "Both members accepted. Concierge will coordinate online details.",
  ONLINE_MEET_OPTIONS_SENT: "Review platform and time options for your online meet.",
  ONLINE_MEET_TIMEOUT: "The online meet coordination timed out due to non-response.",
  ONLINE_MEET_NO_OVERLAP: "No compatible platform/time overlap was found.",
  ONLINE_MEET_FINALIZED: "Your online meeting details are finalized.",
  ONLINE_MEET_RESCHEDULE_UPDATE: "There is an update on your online meet coordination.",
  SOCIAL_EXCHANGE_REQUEST: "Your match requested a temporary social exchange.",
  SOCIAL_EXCHANGE_ACCEPTED: "Your match accepted social exchange.",
  SOCIAL_EXCHANGE_REJECTED: "Your match declined the social exchange request.",
  SOCIAL_EXCHANGE_HANDLE_READY: "A temporary social handle is ready to view.",
  SOCIAL_EXCHANGE_VIEWED: "Your social handle was viewed.",
  SOCIAL_EXCHANGE_EXPIRED: "This social exchange has expired.",
  SOCIAL_EXCHANGE_RESEND_AVAILABLE: "You can send another social exchange request now.",
  PHONE_EXCHANGE_REQUEST: "Your match requested private phone number exchange.",
  PHONE_EXCHANGE_ACCEPTED: "Your match accepted the phone exchange request.",
  PHONE_EXCHANGE_REJECTED: "Your match declined phone number exchange.",
  PHONE_EXCHANGE_MUTUAL_CONSENT_CONFIRMED: "Both members consented. Phone numbers are now available.",
  PHONE_EXCHANGE_REVEALED: "Your match opened the phone number exchange panel."
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
    eventType: (typeof (item.metadata as Record<string, unknown> | null)?.eventType === "string"
      ? (item.metadata as Record<string, unknown>).eventType
      : PRODUCT_ALERT_TYPE_MAP[item.type]) as ProductAlertType,
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
