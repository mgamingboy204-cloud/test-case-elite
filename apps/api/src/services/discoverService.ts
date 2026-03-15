import { prisma } from "../db/prisma";
import type { Gender, Prisma } from "@prisma/client";

type DiscoverFilterOptions = {
  userId: string;
  viewerGender?: string | null;
  city?: string;
  intent?: string;
};

const imageExtensionPattern = /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i;

function resolveIntentGender(intent: string | undefined, viewerGender: string | null | undefined): Gender | undefined {
  const normalizedIntent = intent?.toLowerCase() ?? "dating";
  const normalizedGender = viewerGender?.toUpperCase();
  if (normalizedIntent === "all") return undefined;
  if (!normalizedGender) return undefined;
  if (normalizedIntent === "friends") {
    return normalizedGender as Gender;
  }
  if (normalizedIntent === "dating") {
    if (normalizedGender === "MALE") return "FEMALE" as Gender;
    if (normalizedGender === "FEMALE") return "MALE" as Gender;
    return undefined;
  }
  return undefined;
}

function normalizePhotoUrl(url: string | null | undefined, baseUrl?: string) {
  if (!url) return null;
  const resolved = url.startsWith("/") && baseUrl ? new URL(url, baseUrl).toString() : url;
  if (!/^https?:\/\//i.test(resolved)) return null;
  if (!imageExtensionPattern.test(resolved)) return null;
  return resolved;
}

function buildDiscoverWhere(options: DiscoverFilterOptions) {
  const resolvedGender = resolveIntentGender(options.intent, options.viewerGender);

  const where: Prisma.ProfileWhereInput = {
    userId: { not: options.userId },
    user: {
      deletedAt: null,
      deactivatedAt: null,
      onboardingStep: "ACTIVE",
      status: "APPROVED",
      videoVerificationStatus: "APPROVED",
      paymentStatus: "PAID",
      photos: {
        some: {}
      }
    }
  };

  where.AND = [
    {
      NOT: {
        user: {
          likesReceived: {
            some: {
              actorUserId: options.userId
            }
          }
        }
      }
    },
    {
      NOT: {
        user: {
          OR: [
            { matchesA: { some: { userBId: options.userId, unmatchedAt: null } } },
            { matchesB: { some: { userAId: options.userId, unmatchedAt: null } } }
          ]
        }
      }
    }
  ];

  if (resolvedGender) {
    where.gender = resolvedGender;
  }

  if (options.city) where.city = options.city;

  return where;
}

export async function getDiscoverProfiles(options: {
  userId: string;
  city?: string;
  page?: number;
  pageSize?: number;
  intent?: string;
  baseUrl?: string;
}) {
  const pageNum = options.page ? options.page : 1;
  const take = options.pageSize ? options.pageSize : 10;
  const profile = await prisma.profile.findUnique({ where: { userId: options.userId } });

  const where = buildDiscoverWhere({
    userId: options.userId,
    city: options.city,
    intent: options.intent,
    viewerGender: profile?.gender
  });

  const profiles = await prisma.profile.findMany({
    where,
    orderBy: [{ user: { profileCompletedAt: "desc" } }, { userId: "asc" }],
    skip: (pageNum - 1) * take,
    take,
    select: {
      userId: true,
      name: true,
      age: true,
      city: true,
      bioShort: true,
      intent: true,
      user: {
        select: {
          videoVerificationStatus: true,
          photos: {
            select: {
              url: true
            },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      }
    }
  });

  const formatted = profiles.map((profile) => ({
    userId: profile.userId,
    name: profile.name,
    age: profile.age,
    city: profile.city,
    bioShort: profile.bioShort,
    intent: profile.intent,
    videoVerificationStatus: profile.user?.videoVerificationStatus ?? null,
    primaryPhotoUrl: normalizePhotoUrl(profile.user?.photos?.[0]?.url ?? null, options.baseUrl),
    photos: []
  }));

  return { profiles: formatted };
}

export async function getDiscoverFeed(options: {
  userId: string;
  city?: string;
  intent?: string;
  cursor?: string;
  limit?: number;
  baseUrl?: string;
}) {
  const take = Math.min(Math.max(options.limit ?? 20, 1), 50);
  const profile = await prisma.profile.findUnique({ where: { userId: options.userId } });

  const where = buildDiscoverWhere({
    userId: options.userId,
    city: options.city,
    intent: options.intent,
    viewerGender: profile?.gender
  });

  const feedWhere: Prisma.ProfileWhereInput = {
    ...where,
    ...(options.cursor
      ? {
          AND: [...(Array.isArray(where.AND) ? where.AND : []), { userId: { gt: options.cursor } }]
        }
      : {})
  };

  const profiles = await prisma.profile.findMany({
    where: feedWhere,
    orderBy: [{ userId: "asc" }],
    take: take + 1,
    select: {
      userId: true,
      name: true,
      age: true,
      city: true,
      bioShort: true,
      locationLabel: true,
      profession: true,
      heightCm: true,
      dateOfBirth: true,
      intent: true,
      user: {
        select: {
          videoVerificationStatus: true,
          photos: {
            select: {
              url: true
            },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      }
    }
  });

  const pageProfiles = profiles.slice(0, take);

  const formatted = pageProfiles.map((profile) => ({
    userId: profile.userId,
    name: profile.name,
    age: profile.age,
    city: profile.city,
    bioShort: profile.bioShort,
    locationLabel: profile.locationLabel,
    profession: profile.profession,
    heightCm: profile.heightCm,
    dateOfBirth: profile.dateOfBirth,
    intent: profile.intent,
    videoVerificationStatus: profile.user?.videoVerificationStatus ?? null,
    primaryPhotoUrl: normalizePhotoUrl(profile.user?.photos?.[0]?.url ?? null, options.baseUrl)
  }));

  const nextCursor = profiles.length > take ? pageProfiles[pageProfiles.length - 1]?.userId : undefined;

  return { items: formatted, nextCursor };
}

export async function getDiscoverProfileDetail(options: { userId: string; targetUserId: string; baseUrl?: string }) {
  const profile = await prisma.profile.findUnique({
    where: { userId: options.targetUserId },
    include: {
      user: {
        select: {
          status: true,
          verifiedAt: true,
          videoVerificationStatus: true,
          photos: { select: { url: true }, orderBy: { createdAt: "desc" }, take: 1 }
        }
      }
    }
  });
  if (!profile) {
    return null;
  }
  return {
    userId: profile.userId,
    name: profile.name,
    gender: profile.gender,
    age: profile.age,
    city: profile.city,
    profession: profile.profession,
    bioShort: profile.bioShort,
    intent: profile.intent,
    primaryPhotoUrl: normalizePhotoUrl(profile.user?.photos?.[0]?.url ?? null, options.baseUrl),
    verifiedAt: profile.user?.verifiedAt ?? null,
    videoVerificationStatus: profile.user?.videoVerificationStatus ?? null,
    status: profile.user?.status ?? null
  };
}
