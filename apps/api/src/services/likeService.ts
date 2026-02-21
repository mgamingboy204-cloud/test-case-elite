import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";

function isMissingNotificationTable(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021";
}

export async function createLike(options: { fromUserId: string; toUserId: string; type: "LIKE" | "PASS" }) {
  const oppositeType = options.type === "LIKE" ? "PASS" : "LIKE";

  const result = await prisma.$transaction(async (tx) => {
    await tx.like.deleteMany({
      where: {
        fromUserId: options.fromUserId,
        toUserId: options.toUserId,
        type: oppositeType
      }
    });

    const like = await tx.like.upsert({
      where: { fromUserId_toUserId: { fromUserId: options.fromUserId, toUserId: options.toUserId } },
      update: { type: options.type },
      create: {
        fromUserId: options.fromUserId,
        toUserId: options.toUserId,
        type: options.type
      }
    });

    if (options.type === "LIKE") {
      try {
        await tx.notification.createMany({
          data: [
            {
              userId: options.toUserId,
              actorUserId: options.fromUserId,
              type: "NEW_LIKE"
            }
          ],
          skipDuplicates: true
        });
      } catch (error) {
        if (!isMissingNotificationTable(error)) {
          throw error;
        }
      }
    }

    let match = null as { id: string } | null;
    if (options.type === "LIKE") {
      const reciprocal = await tx.like.findFirst({
        where: { fromUserId: options.toUserId, toUserId: options.fromUserId, type: "LIKE" }
      });
      if (reciprocal) {
        const ordered = [options.fromUserId, options.toUserId].sort();
        match = await tx.match.upsert({
          where: { userAId_userBId: { userAId: ordered[0], userBId: ordered[1] } },
          update: {},
          create: { userAId: ordered[0], userBId: ordered[1] }
        });
        try {
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
        } catch (error) {
          if (!isMissingNotificationTable(error)) {
            throw error;
          }
        }
      }
    }

    return { like, match };
  });

  return { matchId: result.match?.id ?? null };
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

export async function rewindLastLike(userId: string) {
  const lastAction = await prisma.like.findFirst({
    where: { fromUserId: userId },
    orderBy: { createdAt: "desc" }
  });

  if (!lastAction) {
    return { rewoundProfileId: null as string | null };
  }

  await prisma.$transaction(async (tx) => {
    await tx.like.delete({ where: { id: lastAction.id } });
    if (lastAction.type !== "LIKE") {
      return;
    }

    const ordered = [lastAction.fromUserId, lastAction.toUserId].sort();
    const match = await tx.match.findUnique({
      where: { userAId_userBId: { userAId: ordered[0], userBId: ordered[1] } }
    });

    if (!match) {
      return;
    }

    const reciprocalLike = await tx.like.findFirst({
      where: {
        fromUserId: lastAction.toUserId,
        toUserId: lastAction.fromUserId,
        type: "LIKE"
      }
    });

    if (!reciprocalLike) {
      await tx.match.delete({ where: { id: match.id } });
    }
  });

  return { rewoundProfileId: lastAction.toUserId };
}
