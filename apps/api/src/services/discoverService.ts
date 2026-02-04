import { prisma } from "../db/prisma";

export async function getDiscoverProfiles(options: {
  userId: string;
  gender?: string;
  city?: string;
  minAge?: number;
  maxAge?: number;
  page?: number;
  pageSize?: number;
  mode?: string;
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

  if (preference) {
    where.gender = preference;
  } else if (defaultGender) {
    where.gender = defaultGender;
  }
  if (options.city) where.city = options.city;
  if (options.minAge !== undefined || options.maxAge !== undefined) {
    where.age = {};
    if (options.minAge !== undefined) where.age.gte = options.minAge;
    if (options.maxAge !== undefined) where.age.lte = options.maxAge;
  }

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
      profession: true,
      bioShort: true,
      preferences: true,
      user: {
        select: {
          photos: {
            select: {
              url: true
            },
            orderBy: { createdAt: "asc" }
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
    profession: profile.profession,
    bioShort: profile.bioShort,
    preferences: profile.preferences,
    primaryPhotoUrl: profile.user?.photos?.[0]?.url ?? null,
    photos: (profile.user?.photos ?? []).map((photo) => photo.url)
  }));

  return { profiles: formatted };
}
