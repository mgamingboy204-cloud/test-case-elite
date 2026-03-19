import type { NotificationType } from "@prisma/client";

export function notificationDedupeKey(input: {
  userId: string;
  type: NotificationType;
  actorUserId?: string | null;
  matchId?: string | null;
}) {
  const actor = input.actorUserId ?? "none";
  const match = input.matchId ?? "none";
  return `${input.userId}:${input.type}:${actor}:${match}`;
}

