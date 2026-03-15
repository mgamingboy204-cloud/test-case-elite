import { PrismaClient, Role, UserStatus, OnboardingStep, VideoVerificationStatus, OnboardingPaymentStatus, Gender } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  if (process.env.RUN_SEED !== "true") {
    console.log("Seed skipped. Set RUN_SEED=true to create a bootstrap admin user.");
    return;
  }

  const phone = process.env.SEED_ADMIN_PHONE ?? "9999999999";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345";
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { phone },
    update: {
      email,
      passwordHash,
      role: Role.ADMIN,
      isAdmin: true,
      status: UserStatus.APPROVED,
      verifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      onboardingStep: OnboardingStep.ACTIVE,
      videoVerificationStatus: VideoVerificationStatus.APPROVED,
      paymentStatus: OnboardingPaymentStatus.PAID,
      profileCompletedAt: new Date()
    },
    create: {
      phone,
      email,
      passwordHash,
      role: Role.ADMIN,
      isAdmin: true,
      status: UserStatus.APPROVED,
      verifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      onboardingStep: OnboardingStep.ACTIVE,
      videoVerificationStatus: VideoVerificationStatus.APPROVED,
      paymentStatus: OnboardingPaymentStatus.PAID,
      profileCompletedAt: new Date()
    }
  });

  await prisma.user.upsert({
    where: { employeeId: "EMP-001" },
    update: {
      phone: process.env.SEED_EMPLOYEE_PHONE ?? "8888888888",
      email: process.env.SEED_EMPLOYEE_EMAIL ?? "employee1@example.com",
      passwordHash,
      role: Role.EMPLOYEE,
      isAdmin: false,
      status: UserStatus.APPROVED,
      verifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      onboardingStep: OnboardingStep.ACTIVE,
      videoVerificationStatus: VideoVerificationStatus.APPROVED,
      paymentStatus: OnboardingPaymentStatus.PAID,
      profileCompletedAt: new Date()
    },
    create: {
      employeeId: "EMP-001",
      phone: process.env.SEED_EMPLOYEE_PHONE ?? "8888888888",
      email: process.env.SEED_EMPLOYEE_EMAIL ?? "employee1@example.com",
      passwordHash,
      role: Role.EMPLOYEE,
      isAdmin: false,
      status: UserStatus.APPROVED,
      verifiedAt: new Date(),
      phoneVerifiedAt: new Date(),
      onboardingStep: OnboardingStep.ACTIVE,
      videoVerificationStatus: VideoVerificationStatus.APPROVED,
      paymentStatus: OnboardingPaymentStatus.PAID,
      profileCompletedAt: new Date()
    }
  });

  await prisma.profile.upsert({
    where: { userId: admin.id },
    update: {
      name: "Admin",
      gender: Gender.OTHER,
      age: 30,
      city: "HQ",
      profession: "Administrator",
      bioShort: "Administrative account.",
    },
    create: {
      userId: admin.id,
      name: "Admin",
      gender: Gender.OTHER,
      age: 30,
      city: "HQ",
      profession: "Administrator",
      bioShort: "Administrative account.",
    }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      action: "seed_admin",
      targetType: "User",
      targetId: admin.id,
      metadata: { note: "Bootstrap admin user created." }
    }
  });

  console.log("Seed completed: bootstrap admin + employee users.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
