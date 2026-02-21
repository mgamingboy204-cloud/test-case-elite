import crypto from "crypto";
import { prisma } from "../db/prisma";

type DiscoverFilterOptions = {
  userId: string;
  viewerGender?: string | null;
  city?: string;
  intent?: string;
};

const imageExtensionPattern = /\.(png|jpe?g|webp|gif|avif)(\?.*)?$/i;

function resolveIntentGender(intent: string | undefined, viewerGender: string | null | undefined) {
  const normalizedIntent = intent?.toLowerCase() ?? "dating";
  const normalizedGender = viewerGender?.toUpperCase();
  if (normalizedIntent === "all") return undefined;
  if (!normalizedGender) return undefined;
  if (normalizedIntent === "friends") {
    return normalizedGender;
  }
  if (normalizedIntent === "dating") {
    if (normalizedGender === "MALE") return "FEMALE";
    if (normalizedGender === "FEMALE") return "MALE";
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
              fromUserId: options.userId,
              type: "LIKE"
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

  if (resolvedGender) {
    where.gender = resolvedGender;
  }

  if (options.city) where.city = options.city;

  return where;
}

type DiscoverCursorState = {
  offset: number;
  seed: string;
};

function decodeCursor(cursor?: string): DiscoverCursorState | null {
  if (!cursor) return null;
  if (/^\d+$/.test(cursor)) {
    return { offset: Number(cursor), seed: crypto.randomUUID() };
  }
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<DiscoverCursorState>;
    if (typeof parsed.offset === "number" && typeof parsed.seed === "string") {
      return { offset: parsed.offset, seed: parsed.seed };
    }
  } catch {
    return null;
  }
  return null;
}

function encodeCursor(state: DiscoverCursorState) {
  return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

function createSeededRng(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed<T>(items: T[], seed: string) {
  const rng = createSeededRng(seed);
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
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
  const take = options.limit ?? 24;
  const cursorState = decodeCursor(options.cursor) ?? { offset: 0, seed: crypto.randomUUID() };
  const offset = cursorState.offset;
  const profile = await prisma.profile.findUnique({ where: { userId: options.userId } });

  const where = buildDiscoverWhere({
    userId: options.userId,
    city: options.city,
    intent: options.intent,
    viewerGender: profile?.gender
  });

  const profiles = await prisma.profile.findMany({
    where,
    orderBy: [{ userId: "asc" }],
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

  const shuffledProfiles = shuffleWithSeed(profiles, cursorState.seed);
  const pageProfiles = shuffledProfiles.slice(offset, offset + take);

  const formatted = pageProfiles.map((profile) => ({
    userId: profile.userId,
    name: profile.name,
    age: profile.age,
    city: profile.city,
    bioShort: profile.bioShort,
    intent: profile.intent,
    videoVerificationStatus: profile.user?.videoVerificationStatus ?? null,
    primaryPhotoUrl: normalizePhotoUrl(profile.user?.photos?.[0]?.url ?? null, options.baseUrl)
  }));

  const nextCursor =
    offset + take < shuffledProfiles.length ? encodeCursor({ offset: offset + take, seed: cursorState.seed }) : undefined;

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
