import { prisma } from "../db/prisma";

type DiscoverFilterOptions = {
  userId: string;
  gender?: string;
  city?: string;
  minAge?: number;
  maxAge?: number;
  mode?: string;
  intent?: string;
};

function buildDiscoverWhere(options: DiscoverFilterOptions) {
  const modeValue = options.mode === "friends" ? "friends" : "dating";
  const normalizedGender = options.gender ? options.gender.toUpperCase() : undefined;

  const where: any = {
    userId: { not: options.userId },
    user: {
      deletedAt: null,
      deactivatedAt: null,
      onboardingStep: "ACTIVE"
    }
  };

  where.AND = [
    {
      NOT: {
        user: {
          likesReceived: {
            some: {
              fromUserId: options.userId
            }
          }
        }
      }
    },
    {
      NOT: {
        user: {
          OR: [
            { matchesA: { some: { userBId: options.userId } } },
            { matchesB: { some: { userAId: options.userId } } }
          ]
        }
      }
    }
  ];

  if (normalizedGender) {
    where.gender = normalizedGender;
  } else if (modeValue === "dating") {
    where.gender = undefined;
  }

  if (options.city) where.city = options.city;
  if (options.minAge !== undefined || options.maxAge !== undefined) {
    where.age = {};
    if (options.minAge !== undefined) where.age.gte = options.minAge;
    if (options.maxAge !== undefined) where.age.lte = options.maxAge;
  }

  if (options.intent) {
    const intent = options.intent.toLowerCase();
    if (intent === "friends") {
      where.preferences = { path: ["intent"], equals: "friends" };
    } else if (intent === "dating") {
      where.NOT = { preferences: { path: ["intent"], equals: "friends" } };
    }
  }

  return where;
}

export async function getDiscoverProfiles(options: {
  userId: string;
  gender?: string;
  city?: string;
  minAge?: number;
  maxAge?: number;
  page?: number;
  pageSize?: number;
  mode?: string;
  intent?: string;
}) {
  const pageNum = options.page ? options.page : 1;
  const take = options.pageSize ? options.pageSize : 10;
  const profile = await prisma.profile.findUnique({ where: { userId: options.userId } });
  const modeValue = options.mode === "friends" ? "friends" : "dating";
  const normalizedGender = profile?.gender?.toString().toLowerCase();
  const defaultGender =
    modeValue === "friends"
      ? undefined
      : normalizedGender === "male"
        ? "FEMALE"
        : normalizedGender === "female"
          ? "MALE"
          : undefined;
  const requestGender = options.gender ? options.gender.toUpperCase() : undefined;
  const preference =
    modeValue === "friends"
      ? requestGender
      : requestGender ?? (profile?.genderPreference === "ALL" ? undefined : profile?.genderPreference);

  const where = buildDiscoverWhere({
    userId: options.userId,
    gender: preference ?? defaultGender,
    city: options.city,
    minAge: options.minAge,
    maxAge: options.maxAge,
    mode: options.mode,
    intent: options.intent
  });

  const profiles = await prisma.profile.findMany({
    where,
    orderBy: [{ user: { profileCompletedAt: "desc" } }, { userId: "asc" }],
    skip: (pageNum - 1) * take,
    take,
    select: {
      userId: true,
      name: true,
      gender: true,
      age: true,
      city: true,
      bioShort: true,
      preferences: true,
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
    gender: profile.gender,
    age: profile.age,
    city: profile.city,
    bioShort: profile.bioShort,
    preferences: profile.preferences,
    videoVerificationStatus: profile.user?.videoVerificationStatus ?? null,
    primaryPhotoUrl: profile.user?.photos?.[0]?.url ?? null,
    photos: []
  }));

  return { profiles: formatted };
}

export async function getDiscoverFeed(options: {
  userId: string;
  gender?: string;
  city?: string;
  minAge?: number;
  maxAge?: number;
  mode?: string;
  intent?: string;
  cursor?: number;
  limit?: number;
}) {
  const take = options.limit ?? 24;
  const offset = options.cursor ?? 0;
  const profile = await prisma.profile.findUnique({ where: { userId: options.userId } });
  const modeValue = options.mode === "friends" ? "friends" : "dating";
  const normalizedGender = profile?.gender?.toString().toLowerCase();
  const defaultGender =
    modeValue === "friends"
      ? undefined
      : normalizedGender === "male"
        ? "FEMALE"
        : normalizedGender === "female"
          ? "MALE"
          : undefined;
  const requestGender = options.gender ? options.gender.toUpperCase() : undefined;
  const preference =
    modeValue === "friends"
      ? requestGender
      : requestGender ?? (profile?.genderPreference === "ALL" ? undefined : profile?.genderPreference);

  const where = buildDiscoverWhere({
    userId: options.userId,
    gender: preference ?? defaultGender,
    city: options.city,
    minAge: options.minAge,
    maxAge: options.maxAge,
    mode: options.mode,
    intent: options.intent
  });

  const profiles = await prisma.profile.findMany({
    where,
    orderBy: [{ user: { profileCompletedAt: "desc" } }, { userId: "asc" }],
    skip: offset,
    take,
    select: {
      userId: true,
      name: true,
      gender: true,
      age: true,
      city: true,
      bioShort: true,
      preferences: true,
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
    gender: profile.gender,
    age: profile.age,
    city: profile.city,
    bioShort: profile.bioShort,
    preferences: profile.preferences,
    videoVerificationStatus: profile.user?.videoVerificationStatus ?? null,
    primaryPhotoUrl: profile.user?.photos?.[0]?.url ?? null
  }));

  const nextCursor = profiles.length === take ? String(offset + take) : undefined;

  return { items: formatted, nextCursor };
}

export async function getDiscoverProfileDetail(options: { userId: string; targetUserId: string }) {
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
    preferences: profile.preferences,
    primaryPhotoUrl: profile.user?.photos?.[0]?.url ?? null,
    verifiedAt: profile.user?.verifiedAt ?? null,
    videoVerificationStatus: profile.user?.videoVerificationStatus ?? null,
    status: profile.user?.status ?? null
  };
}
