import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

export async function getProfile(userId: string) {
  const [profile, photos] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.photo.findMany({ where: { userId }, orderBy: { createdAt: "asc" } })
  ]);
  return { profile, photos };
}

export async function updateProfile(options: { userId: string; paymentStatus: string; onboardingStep: string; data: any }) {
  if (options.paymentStatus !== "PAID") {
    throw new HttpError(403, {
      error: "Payment required",
      currentStep: options.onboardingStep,
      requiredStep: "PAID",
      redirectTo: "/onboarding/payment"
    });
  }

  const normalized = { ...options.data };
  if (typeof normalized.gender === "string") {
    normalized.gender = normalized.gender.toUpperCase();
  }
  if (typeof normalized.genderPreference === "string") {
    normalized.genderPreference = normalized.genderPreference.toUpperCase();
  }

  const profile = await prisma.profile.upsert({
    where: { userId: options.userId },
    update: normalized,
    create: { ...normalized, userId: options.userId }
  });

  const photoCount = await prisma.photo.count({ where: { userId: options.userId } });
  let user = await prisma.user.findUnique({ where: { id: options.userId } });
  if (!user) {
    throw new HttpError(404, { error: "User not found" });
  }

  if (photoCount > 0) {
    user = await prisma.user.update({
      where: { id: options.userId },
      data: {
        profileCompletedAt: user.profileCompletedAt ?? new Date(),
        onboardingStep: "ACTIVE",
        status: "APPROVED"
      }
    });
  } else if (user.onboardingStep !== "PROFILE_PENDING") {
    user = await prisma.user.update({
      where: { id: options.userId },
      data: { onboardingStep: "PROFILE_PENDING" }
    });
  }

  return { profile, requiresPhoto: photoCount === 0, onboardingStep: user.onboardingStep };
}

export async function completeProfile(options: {
  userId: string;
  paymentStatus: string;
  onboardingStep: string;
  profileCompletedAt?: Date | null;
}) {
  if (options.paymentStatus !== "PAID") {
    throw new HttpError(403, {
      error: "Payment required",
      currentStep: options.onboardingStep,
      requiredStep: "PAID",
      redirectTo: "/onboarding/payment"
    });
  }

  const profile = await prisma.profile.findUnique({ where: { userId: options.userId } });
  if (!profile) {
    throw new HttpError(400, { error: "Profile must be completed first." });
  }

  const photoCount = await prisma.photo.count({ where: { userId: options.userId } });
  if (photoCount === 0) {
    throw new HttpError(400, { error: "At least one photo is required to activate your profile." });
  }

  const user = await prisma.user.update({
    where: { id: options.userId },
    data: {
      profileCompletedAt: options.profileCompletedAt ?? new Date(),
      onboardingStep: "ACTIVE",
      status: "APPROVED"
    }
  });

  return { ok: true, onboardingStep: user.onboardingStep };
}
