import { prisma } from "../db/prisma";

export async function createLike(options: { actorUserId: string; targetUserId: string; action: "LIKE" | "PASS"; actionId: string }) {
  const oppositeAction = options.action === "LIKE" ? "PASS" : "LIKE";

  const result = await prisma.$transaction(async (tx) => {
    const existingAction = await tx.like.findUnique({ where: { actionId: options.actionId } });
    if (existingAction) {
      return { like: existingAction, match: null, alreadyProcessed: true };
    }

    await tx.like.deleteMany({
      where: {
        actorUserId: options.actorUserId,
        targetUserId: options.targetUserId,
        action: oppositeAction
      }
    });

    const like = await tx.like.upsert({
      where: { actorUserId_targetUserId: { actorUserId: options.actorUserId, targetUserId: options.targetUserId } },
      update: { action: options.action, actionId: options.actionId },
      create: {
        actionId: options.actionId,
        actorUserId: options.actorUserId,
        targetUserId: options.targetUserId,
        action: options.action
      }
    });

    if (options.action === "LIKE") {
      await tx.notification.createMany({
        data: [{ userId: options.targetUserId, actorUserId: options.actorUserId, type: "NEW_LIKE" }],
        skipDuplicates: true
      });
    }

    let match = null as { id: string } | null;
    if (options.action === "LIKE") {
      const reciprocal = await tx.like.findFirst({
        where: { actorUserId: options.targetUserId, targetUserId: options.actorUserId, action: "LIKE" }
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
            { userId: ordered[0], actorUserId: ordered[1], type: "NEW_MATCH", matchId: match.id },
            { userId: ordered[1], actorUserId: ordered[0], type: "NEW_MATCH", matchId: match.id }
          ],
          skipDuplicates: true
        });
      }
    }

    return { like, match, alreadyProcessed: false };
  });

  return { matchId: result.match?.id ?? null, alreadyProcessed: result.alreadyProcessed };
}

export async function getIncomingLikes(userId: string) {
  const incoming = await prisma.like.findMany({
    where: {
      targetUserId: userId,
      action: "LIKE",
      NOT: {
        OR: [
          { actorUser: { matchesA: { some: { userBId: userId } } } },
          { actorUser: { matchesB: { some: { userAId: userId } } } }
        ]
      }
    },
    include: {
      actorUser: {
        select: {
          id: true,
          phone: true,
          profile: true,
          photos: {
            select: { url: true },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return {
    incoming: incoming.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      action: item.action,
      actorUser: item.actorUser,
      fromUser: item.actorUser
    }))
  };
}

export async function getOutgoingLikes(userId: string) {
  const outgoing = await prisma.like.findMany({
    where: {
      actorUserId: userId,
      action: "LIKE"
    },
    include: {
      targetUser: {
        select: {
          id: true,
          phone: true,
          profile: true,
          photos: {
            select: { url: true },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return {
    outgoing: outgoing.map((item) => ({
      id: item.id,
      createdAt: item.createdAt,
      action: item.action,
      targetUser: item.targetUser,
      toUser: item.targetUser
    }))
  };
}
