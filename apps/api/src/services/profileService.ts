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
      message: "Payment required",
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
  const nameParts = displayName ? displayName.split(" ").filter(Boolean) : [];
  const firstName = rawFirstName?.toString().trim() || nameParts[0] || null;
  const lastName =
    rawLastName?.toString().trim() || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : null);

  const profileData = {
    name: normalized.name,
    gender: normalized.gender,
    age: normalized.age,
    city: normalized.city,
    profession: normalized.profession,
    bioShort: normalized.bioShort,
    intent: normalized.intent ?? "dating"
  };

  const profile = await prisma.profile.upsert({
    where: { userId: options.userId },
    update: profileData,
    create: { ...profileData, userId: options.userId }
  });

  const user = await prisma.user.findUnique({ where: { id: options.userId } });
  if (!user) {
    throw new HttpError(404, { message: "User not found" });
  }

  const updatedUser = await prisma.user.update({
    where: { id: options.userId },
    data: {
      displayName: displayName || user.displayName,
      firstName,
      lastName,
      gender: normalized.gender ?? user.gender,
      profileCompletedAt: user.profileCompletedAt ?? new Date(),
      onboardingStep: "ACTIVE",
      status: "APPROVED"
    }
  });

  return { profile, requiresPhoto: false, onboardingStep: updatedUser.onboardingStep };
}


export async function patchProfile(options: { userId: string; data: any }) {
  const existing = await prisma.profile.findUnique({ where: { userId: options.userId } });
  if (!existing) {
    throw new HttpError(404, { message: "Profile not found" });
  }

  const normalized = { ...options.data };
  const rawFirstName = normalized.firstName;
  const rawLastName = normalized.lastName;
  const displayName = (normalized.displayName ?? normalized.name ?? "").toString().trim();
  if (displayName) normalized.name = displayName;
  delete normalized.displayName;
  delete normalized.firstName;
  delete normalized.lastName;
  if (typeof normalized.gender === "string") {
    normalized.gender = normalized.gender.toUpperCase();
  }

  const profile = await prisma.profile.update({
    where: { userId: options.userId },
    data: {
      name: normalized.name ?? undefined,
      gender: normalized.gender ?? undefined,
      age: normalized.age ?? undefined,
      city: normalized.city ?? undefined,
      profession: normalized.profession ?? undefined,
      bioShort: normalized.bioShort ?? undefined,
      intent: normalized.intent ?? undefined
    }
  });

  const user = await prisma.user.findUnique({ where: { id: options.userId } });
  if (!user) throw new HttpError(404, { message: "User not found" });

  const nameParts = displayName ? displayName.split(" ").filter(Boolean) : [];
  const firstName = rawFirstName?.toString().trim() || (displayName ? nameParts[0] ?? null : undefined);
  const lastName = rawLastName?.toString().trim() || (displayName && nameParts.length > 1 ? nameParts.slice(1).join(" ") : undefined);

  await prisma.user.update({
    where: { id: options.userId },
    data: {
      displayName: displayName || undefined,
      firstName,
      lastName,
      gender: normalized.gender ?? undefined
    }
  });

  return { profile };
}
export async function completeProfile(options: {
  userId: string;
  paymentStatus: string;
  onboardingStep: string;
  profileCompletedAt?: Date | null;
}) {
  if (options.paymentStatus !== "PAID") {
    throw new HttpError(403, {
      message: "Payment required",
      currentStep: options.onboardingStep,
      requiredStep: "PAID",
      redirectTo: "/onboarding/payment"
    });
  }

  const profile = await prisma.profile.findUnique({ where: { userId: options.userId } });
  if (!profile) {
    throw new HttpError(400, { message: "Profile must be completed first." });
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
