import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedPhones = [
  "9999999999",
  ...Array.from({ length: 10 }, (_, i) => `55500000${i + 1}`.padEnd(10, "0"))
];

const seedEmails = [
  "admin@example.com",
  ...Array.from({ length: 10 }, (_, i) => `user${i + 1}@example.com`)
];

async function purgeUser(userId: string) {
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
    await tx.like.deleteMany({ where: { OR: [{ fromUserId: userId }, { toUserId: userId }] } });
    await tx.report.deleteMany({ where: { OR: [{ reporterId: userId }, { reportedUserId: userId }] } });
    await tx.refundRequest.deleteMany({ where: { userId } });
    await tx.payment.deleteMany({ where: { userId } });
    await tx.photo.deleteMany({ where: { userId } });
    await tx.profile.deleteMany({ where: { userId } });
    await tx.auditLog.deleteMany({ where: { actorUserId: userId } });
    await tx.user.delete({ where: { id: userId } });
  });
}

async function main() {
  if (process.env.RUN_SEED_CLEANUP !== "true") {
    console.log("Seed cleanup skipped. Set RUN_SEED_CLEANUP=true to purge demo users.");
    return;
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [{ phone: { in: seedPhones } }, { email: { in: seedEmails } }]
    },
    select: { id: true, phone: true, email: true }
  });

  if (!users.length) {
    console.log("No seed users found.");
    return;
  }

  for (const user of users) {
    await purgeUser(user.id);
    console.log(`Purged seed user ${user.phone}${user.email ? ` (${user.email})` : ""}`);
  }

  console.log(`Seed cleanup complete. Removed ${users.length} users.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
