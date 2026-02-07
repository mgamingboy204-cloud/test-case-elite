import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

export async function getProfile(userId: string) {
  const [profile, photos, user] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.photo.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, displayName: true, gender: true }
    })
  ]);
  return { profile, photos, user };
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
  const rawFirstName = normalized.firstName;
  const rawLastName = normalized.lastName;
  const displayName = (normalized.displayName ?? normalized.name ?? "").toString().trim();
  if (displayName) {
    normalized.name = displayName;
  }
  delete normalized.displayName;
  delete normalized.firstName;
  delete normalized.lastName;
  if (typeof normalized.gender === "string") {
    normalized.gender = normalized.gender.toUpperCase();
  }
  if (typeof normalized.genderPreference === "string") {
    normalized.genderPreference = normalized.genderPreference.toUpperCase();
  }
  const nameParts = displayName ? displayName.split(" ").filter(Boolean) : [];
  const firstName = rawFirstName?.toString().trim() || nameParts[0] || null;
  const lastName =
    rawLastName?.toString().trim() || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : null);

  const profileData = {
    name: normalized.name,
    gender: normalized.gender,
    genderPreference: normalized.genderPreference,
    age: normalized.age,
    city: normalized.city,
    profession: normalized.profession,
    bioShort: normalized.bioShort,
    preferences: normalized.preferences ?? {}
  };

  const profile = await prisma.profile.upsert({
    where: { userId: options.userId },
    update: profileData,
    create: { ...profileData, userId: options.userId }
  });

  const photoCount = await prisma.photo.count({ where: { userId: options.userId } });
  let user = await prisma.user.findUnique({ where: { id: options.userId } });
  if (!user) {
    throw new HttpError(404, { error: "User not found" });
  }

  const baseUserUpdate = {
    displayName: displayName || user.displayName,
    firstName,
    lastName,
    gender: normalized.gender ?? user.gender
  };

  if (photoCount > 0) {
    user = await prisma.user.update({
      where: { id: options.userId },
      data: {
        ...baseUserUpdate,
        profileCompletedAt: user.profileCompletedAt ?? new Date(),
        onboardingStep: "ACTIVE",
        status: "APPROVED"
      }
    });
  } else if (user.onboardingStep !== "PROFILE_PENDING") {
    user = await prisma.user.update({
      where: { id: options.userId },
      data: {
        onboardingStep: "PROFILE_PENDING",
        ...baseUserUpdate
      }
    });
  } else {
    user = await prisma.user.update({
      where: { id: options.userId },
      data: baseUserUpdate
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
