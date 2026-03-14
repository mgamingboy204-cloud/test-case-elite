import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

type UpdateOptions = { userId: string; paymentStatus: string; onboardingStep: string; data: any };

function toHeightLabel(heightCm: number | null | undefined) {
  if (!heightCm) return null;
  const totalInches = Math.round(heightCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}"`;
}

function toHeightCm(heightValue: string | number | null | undefined) {
  if (typeof heightValue === "number") return heightValue;
  if (typeof heightValue !== "string") return undefined;
  const trimmed = heightValue.trim();
  const feetInchesMatch = trimmed.match(/^(\d)'\s*(\d{1,2})"?$/);
  if (feetInchesMatch) {
    const feet = Number(feetInchesMatch[1]);
    const inches = Number(feetInchesMatch[2]);
    return Math.round((feet * 12 + inches) * 2.54);
  }
  const cm = Number(trimmed);
  return Number.isFinite(cm) ? cm : undefined;
}

export async function getProfile(userId: string) {
  const [profile, photos, user, preferences] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    prisma.photo.findMany({ where: { userId }, orderBy: [{ photoIndex: "asc" }, { createdAt: "asc" }] }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        displayName: true,
        gender: true,
        subscriptionTier: true,
        subscriptionStatus: true
      }
    }),
    prisma.userPreference.upsert({ where: { userId }, update: {}, create: { userId } })
  ]);

  return {
    profile,
    photos,
    user,
    settings: preferences,
    viewModel: {
      name: user?.displayName ?? profile?.name ?? "",
      profession: profile?.profession ?? "",
      story: profile?.story ?? profile?.bioShort ?? "",
      location: profile?.locationLabel ?? profile?.city ?? "",
      height: toHeightLabel(profile?.heightCm),
      subscription: {
        tier: user?.subscriptionTier ?? "FREE",
        status: user?.subscriptionStatus ?? "INACTIVE"
      },
      settings: preferences,
      photos
    }
  };
}

export async function updateProfile(options: UpdateOptions) {
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
  if (displayName) normalized.name = displayName;

  const profileData: Record<string, unknown> = {};
  const assignIfDefined = (key: string, value: unknown) => {
    if (value !== undefined) profileData[key] = value;
  };

  if (typeof normalized.gender === "string") {
    normalized.gender = normalized.gender.toUpperCase();
  }

  assignIfDefined("name", normalized.name);
  assignIfDefined("gender", normalized.gender);
  assignIfDefined("age", normalized.age);
  assignIfDefined("city", normalized.city);
  assignIfDefined("profession", normalized.profession);
  assignIfDefined("bioShort", normalized.bioShort);
  assignIfDefined("story", normalized.story);
  assignIfDefined("locationLabel", normalized.locationLabel ?? normalized.city);
  assignIfDefined("intent", normalized.intent ?? "dating");

  const parsedHeightCm = toHeightCm(normalized.heightCm ?? normalized.height);
  if (parsedHeightCm !== undefined) assignIfDefined("heightCm", parsedHeightCm);

  const profile = await prisma.profile.upsert({
    where: { userId: options.userId },
    update: profileData,
    create: {
      userId: options.userId,
      name: String(normalized.name ?? ""),
      gender: (normalized.gender ?? "OTHER") as any,
      age: Number(normalized.age ?? 18),
      city: String(normalized.city ?? ""),
      profession: String(normalized.profession ?? ""),
      bioShort: String(normalized.bioShort ?? ""),
      intent: String(normalized.intent ?? "dating"),
      story: normalized.story ?? normalized.bioShort,
      locationLabel: normalized.locationLabel ?? normalized.city,
      heightCm: parsedHeightCm
    }
  });

  const user = await prisma.user.findUnique({ where: { id: options.userId } });
  if (!user) throw new HttpError(404, { message: "User not found" });

  const nameParts = displayName ? displayName.split(" ").filter(Boolean) : [];
  const firstName = rawFirstName?.toString().trim() || nameParts[0] || user.firstName || null;
  const lastName = rawLastName?.toString().trim() || (nameParts.length > 1 ? nameParts.slice(1).join(" ") : user.lastName) || null;

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

  if (Array.isArray(normalized.photos)) {
    for (const item of normalized.photos) {
      if (item?.id && typeof item.photoIndex === "number") {
        await prisma.photo.updateMany({
          where: { id: item.id, userId: options.userId },
          data: { photoIndex: item.photoIndex }
        });
      }
    }
  }

  if (normalized.settings && typeof normalized.settings === "object") {
    await updateProfileSettings(options.userId, normalized.settings);
  }

  return { profile, requiresPhoto: false, onboardingStep: updatedUser.onboardingStep };
}

export async function updateProfileSettings(userId: string, data: any) {
  const current = await prisma.userPreference.upsert({ where: { userId }, create: { userId }, update: {} });
  const updated = await prisma.userPreference.update({
    where: { userId },
    data: {
      pushNotificationsEnabled: typeof data?.pushNotificationsEnabled === "boolean" ? data.pushNotificationsEnabled : current.pushNotificationsEnabled,
      profileVisible: typeof data?.profileVisible === "boolean" ? data.profileVisible : current.profileVisible,
      showOnlineStatus: typeof data?.showOnlineStatus === "boolean" ? data.showOnlineStatus : current.showOnlineStatus,
      discoverableByPremiumOnly:
        typeof data?.discoverableByPremiumOnly === "boolean" ? data.discoverableByPremiumOnly : current.discoverableByPremiumOnly
    }
  });
  return { settings: updated };
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
  if (!profile) throw new HttpError(400, { message: "Profile must be completed first." });

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
