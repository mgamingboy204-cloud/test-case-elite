import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";
import { type ProfileInput, type ProfilePatchInput, hasRequiredOnboardingProfile } from "@vael/shared";
import { Gender } from "@prisma/client";

type UpdateOptions = { userId: string; paymentStatus: string; onboardingStep: string; data: ProfileInput | ProfilePatchInput };

function calculateAge(dateOfBirth: Date) {
  const now = new Date();
  let age = now.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dateOfBirth.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dateOfBirth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

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
  const [profile, photos, user, preferences, latestVerificationRequest] = await Promise.all([
    prisma.profile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        name: "",
        gender: Gender.OTHER,
        age: 18,
        city: "",
        profession: "",
        bioShort: ""
      }
    }),
    prisma.photo.findMany({ where: { userId }, orderBy: [{ photoIndex: "asc" }, { createdAt: "asc" }] }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        displayName: true,
        gender: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionEndsAt: true,
        manualRenewalRequired: true,
      onboardingPaymentPlan: true,
      onboardingPaymentAmount: true,
      onboardingPaymentVerifiedAt: true,
      assignedEmployeeId: true,
      assignedAt: true
      }
    }),
    prisma.userPreference.upsert({ where: { userId }, update: {}, create: { userId } }),
    prisma.verificationRequest.findFirst({
      where: { userId },
      orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        assignedEmployeeId: true,
        assignedAt: true,
        status: true
      }
    })
  ]);

  const assignedExecutive = user?.assignedEmployeeId
    ? await prisma.user.findUnique({
        where: { id: user.assignedEmployeeId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true
        }
      })
    : null;

  const executiveName = assignedExecutive
    ? [assignedExecutive.firstName, assignedExecutive.lastName].filter(Boolean).join(" ") || assignedExecutive.displayName || ""
    : "";

  return {
    profile,
    photos,
    user,
    settings: preferences,
    viewModel: {
      name: user?.displayName ?? profile?.name ?? "",
      dateOfBirth: profile?.dateOfBirth ?? null,
      age: profile?.age ?? null,
      gender: profile?.gender ?? user?.gender ?? null,
      profession: profile?.profession ?? "",
      story: profile?.story ?? profile?.bioShort ?? "",
      bio: profile?.bioShort ?? "",
      location: profile?.locationLabel ?? profile?.city ?? "",
      place: profile?.city ?? "",
      height: toHeightLabel(profile?.heightCm),
      heightCm: profile?.heightCm ?? null,
      subscription: {
        tier: user?.subscriptionTier ?? "FREE",
        status: user?.subscriptionStatus ?? "INACTIVE",
        paymentPlan: user?.onboardingPaymentPlan ?? null,
        paymentAmount: user?.onboardingPaymentAmount ?? null,
        startedAt: user?.subscriptionStartedAt ?? null,
        endsAt: user?.subscriptionEndsAt ?? null,
        paidAt: user?.onboardingPaymentVerifiedAt ?? null,
        renewalMode: user?.manualRenewalRequired ? "MANUAL" : "AUTO"
      },
      assignedExecutive: user?.assignedEmployeeId
        ? {
            id: user.assignedEmployeeId,
            name: executiveName || "VAEL Executive",
            assignedAt: user.assignedAt ?? latestVerificationRequest?.assignedAt,
            verificationStatus: latestVerificationRequest?.status ?? null
          }
        : null,
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

  const normalized = { ...options.data } as Record<string, unknown>;
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

  assignIfDefined("name", typeof normalized.name === "string" ? normalized.name.trim() : normalized.name);
  assignIfDefined("gender", normalized.gender);
  assignIfDefined("dateOfBirth", normalized.dateOfBirth);
  assignIfDefined("city", typeof normalized.city === "string" ? normalized.city.trim() : normalized.city);
  assignIfDefined("profession", typeof normalized.profession === "string" ? normalized.profession.trim() : normalized.profession);
  assignIfDefined("bioShort", typeof (normalized.bioShort ?? normalized.bio) === "string" ? String(normalized.bioShort ?? normalized.bio).trim() : normalized.bioShort ?? normalized.bio);
  assignIfDefined("story", typeof normalized.story === "string" ? normalized.story.trim() : normalized.story);
  assignIfDefined("locationLabel", typeof (normalized.locationLabel ?? normalized.place ?? normalized.city) === "string" ? String(normalized.locationLabel ?? normalized.place ?? normalized.city).trim() : normalized.locationLabel ?? normalized.place ?? normalized.city);
  assignIfDefined("intent", normalized.intent ?? "dating");

  if (normalized.dateOfBirth) {
    const dob = new Date(String(normalized.dateOfBirth));
    if (!Number.isNaN(dob.getTime())) {
      const derivedAge = calculateAge(dob);
      assignIfDefined("age", derivedAge);
    }
  } else {
    assignIfDefined("age", normalized.age);
  }

  const parsedHeightCm = toHeightCm((normalized.heightCm ?? normalized.height) as string | number | null | undefined);
  if (parsedHeightCm !== undefined) assignIfDefined("heightCm", parsedHeightCm);

  const profile = await prisma.profile.upsert({
    where: { userId: options.userId },
    update: profileData,
    create: {
      userId: options.userId,
      name: String(normalized.name ?? ""),
      gender: (normalized.gender ?? "OTHER") as Gender,
      age: Number(normalized.age ?? 18),
      dateOfBirth: normalized.dateOfBirth ? new Date(String(normalized.dateOfBirth)) : null,
      city: String(normalized.city ?? ""),
      profession: String(normalized.profession ?? ""),
      bioShort: String(normalized.bioShort ?? normalized.bio ?? ""),
      intent: String(normalized.intent ?? "dating"),
      story: (normalized.story ?? normalized.bioShort ?? normalized.bio) as string | undefined,
      locationLabel: (normalized.locationLabel ?? normalized.place ?? normalized.city) as string | undefined,
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
      profileCompletedAt: hasRequiredOnboardingProfile(profile) ? user.profileCompletedAt ?? new Date() : null,
      onboardingStep: user.onboardingStep === "ACTIVE" ? "ACTIVE" : "PROFILE_PENDING",
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

export async function updateProfileSettings(userId: string, data: {
  pushNotificationsEnabled?: boolean;
  profileVisible?: boolean;
  showOnlineStatus?: boolean;
  discoverableByPremiumOnly?: boolean;
}) {
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
  if (!profile || !hasRequiredOnboardingProfile(profile)) {
    throw new HttpError(400, { message: "Please complete all required profile fields before continuing." });
  }

  const photoCount = await prisma.photo.count({ where: { userId: options.userId } });
  if (photoCount < 1) {
    throw new HttpError(400, {
      message: "At least one photo is required to complete onboarding.",
      currentStep: options.onboardingStep,
      requiredStep: "PHOTOS",
      redirectTo: "/onboarding/photos"
    });
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
