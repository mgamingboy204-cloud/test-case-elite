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
      preferences: {}
    },
    create: {
      userId: admin.id,
      name: "Admin",
      gender: Gender.OTHER,
      age: 30,
      city: "HQ",
      profession: "Administrator",
      bioShort: "Administrative account.",
      preferences: {}
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

  const userPasswordHash = await bcrypt.hash("Password@123", 10);
  const demoUsers = Array.from({ length: 10 }, (_, index) => ({
    phone: `55500000${index + 1}`.padEnd(10, "0"),
    email: `user${index + 1}@example.com`,
    name: `Verified User ${index + 1}`,
    gender: index % 2 === 0 ? Gender.FEMALE : Gender.MALE,
    age: 24 + index,
    city: "Metro City",
    profession: "Professional",
    bioShort: "Verified member of Elite Match.",
    preferences: {}
  }));

  for (const demo of demoUsers) {
    const user = await prisma.user.upsert({
      where: { phone: demo.phone },
      update: {
        email: demo.email,
        passwordHash: userPasswordHash,
        status: UserStatus.APPROVED,
        verifiedAt: new Date(),
        phoneVerifiedAt: new Date(),
        onboardingStep: OnboardingStep.ACTIVE,
        videoVerificationStatus: VideoVerificationStatus.APPROVED,
        paymentStatus: OnboardingPaymentStatus.PAID,
        profileCompletedAt: new Date()
      },
      create: {
        phone: demo.phone,
        email: demo.email,
        passwordHash: userPasswordHash,
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
      where: { userId: user.id },
      update: {
        name: demo.name,
        gender: demo.gender,
        age: demo.age,
        city: demo.city,
        profession: demo.profession,
        bioShort: demo.bioShort,
        preferences: demo.preferences
      },
      create: {
        userId: user.id,
        name: demo.name,
        gender: demo.gender,
        age: demo.age,
        city: demo.city,
        profession: demo.profession,
        bioShort: demo.bioShort,
        preferences: demo.preferences
      }
    });
  }

  console.log("Seed completed: admin + verified demo users.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
