import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to reset database in production.");
  }
  if (process.env.RESET_DEV_DB !== "true") {
    console.log("Reset skipped. Set RESET_DEV_DB=true to wipe the dev database.");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany();
    await tx.verificationSlot.deleteMany();
    await tx.verificationRequest.deleteMany();
    await tx.consent.deleteMany();
    await tx.phoneExchangeEvent.deleteMany();
    await tx.match.deleteMany();
    await tx.like.deleteMany();
    await tx.report.deleteMany();
    await tx.refundRequest.deleteMany();
    await tx.payment.deleteMany();
    await tx.photo.deleteMany();
    await tx.profile.deleteMany();
    await tx.deviceToken.deleteMany();
    await tx.pendingUser.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.otpCode.deleteMany();
    await tx.user.deleteMany();
  });

  console.log("Dev database reset complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
