import { prisma } from "../db/prisma";


export async function createLike(options: { actorUserId: string; targetUserId: string; action: "LIKE" | "PASS"; actionId: string }) {
  const oppositeType = options.action === "LIKE" ? "PASS" : "LIKE";

  const result = await prisma.$transaction(async (tx) => {
    const existingAction = await tx.like.findUnique({ where: { actionId: options.actionId } });
    if (existingAction) {
      return { like: existingAction, match: null, deduplicated: true };
    }

    await tx.like.deleteMany({
      where: {
        fromUserId: options.actorUserId,
        toUserId: options.targetUserId,
        type: oppositeType
      }
    });

    const like = await tx.like.upsert({
      where: { fromUserId_toUserId: { fromUserId: options.actorUserId, toUserId: options.targetUserId } },
      update: { type: options.action, actionId: options.actionId },
      create: {
        actionId: options.actionId,
        fromUserId: options.actorUserId,
        toUserId: options.targetUserId,
        type: options.action
      }
    });

    if (options.action === "LIKE") {
      await tx.notification.createMany({
        data: [
          {
            userId: options.targetUserId,
            actorUserId: options.actorUserId,
            type: "NEW_LIKE"
          }
        ],
        skipDuplicates: true
      });
    }

    let match = null as { id: string } | null;
    if (options.action === "LIKE") {
      const reciprocal = await tx.like.findFirst({
        where: { fromUserId: options.targetUserId, toUserId: options.actorUserId, type: "LIKE" }
      });
      if (reciprocal) {
        const ordered = [options.actorUserId, options.targetUserId].sort();
        match = await tx.match.upsert({
          where: { userAId_userBId: { userAId: ordered[0], userBId: ordered[1] } },
          update: {},
          create: { userAId: ordered[0], userBId: ordered[1] }
        });
        await tx.notification.createMany({
          data: [
            {
              userId: ordered[0],
              actorUserId: ordered[1],
              type: "NEW_MATCH",
              matchId: match.id
            },
            {
              userId: ordered[1],
              actorUserId: ordered[0],
              type: "NEW_MATCH",
              matchId: match.id
            }
          ],
          skipDuplicates: true
        });
      }
    }

    return { like, match, deduplicated: false };
  });

  return { matchId: result.match?.id ?? null, deduplicated: result.deduplicated };
}

export async function getIncomingLikes(userId: string) {
  const incoming = await prisma.like.findMany({
    where: {
      toUserId: userId,
      type: "LIKE",
      NOT: {
        fromUser: {
          likesReceived: {
            some: {
              fromUserId: userId
            }
          }
        }
      }
    },
    include: {
      fromUser: {
        select: { id: true, phone: true, profile: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return { incoming };
}


export async function getOutgoingLikes(userId: string) {
  const outgoing = await prisma.like.findMany({
    where: {
      fromUserId: userId,
      type: "LIKE"
    },
    include: {
      toUser: {
        select: { id: true, phone: true, profile: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });
  return { outgoing };
}
