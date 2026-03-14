import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

export async function getAccountPreferences(userId: string) {
  const preference = await prisma.userPreference.findUnique({ where: { userId } });
  return { theme: preference?.theme ?? "light" };
}

export async function updateAccountPreferences(userId: string, data: { theme?: string }) {
  const theme = data.theme === "dark" ? "dark" : "light";
  const preference = await prisma.userPreference.upsert({
    where: { userId },
    update: { theme },
    create: { userId, theme }
  });
  return { theme: preference.theme };
}

export async function deleteOwnAccount(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new HttpError(404, { message: "User not found" });

  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    select: { id: true }
  });
  const matchIds = matches.map((match) => match.id);

  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({ where: { OR: [{ userId }, { actorUserId: userId }] } });
    await tx.verificationRequest.deleteMany({ where: { userId } });
    await tx.verificationSlot.deleteMany({ where: { userId } });
    await tx.deviceToken.deleteMany({ where: { userId } });
    await tx.consent.deleteMany({ where: { matchId: { in: matchIds } } });
    await tx.phoneExchangeEvent.deleteMany({ where: { matchId: { in: matchIds } } });
    await tx.match.deleteMany({ where: { id: { in: matchIds } } });
    await tx.like.deleteMany({ where: { OR: [{ actorUserId: userId }, { targetUserId: userId }] } });
    await tx.report.deleteMany({ where: { OR: [{ reporterId: userId }, { reportedUserId: userId }] } });
    await tx.refundRequest.deleteMany({ where: { userId } });
    await tx.payment.deleteMany({ where: { userId } });
    await tx.photo.deleteMany({ where: { userId } });
    await tx.profile.deleteMany({ where: { userId } });
    await tx.userPreference.deleteMany({ where: { userId } });
    await tx.auditLog.deleteMany({ where: { actorUserId: userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  return { id: userId, deleted: true };
}
