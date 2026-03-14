import { apiRequest } from "@/lib/api";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop&q=80";

type LegacyIncomingLike = {
  id: string;
  createdAt?: string;
  likedAt?: string;
  action?: "LIKE" | "PASS";
  fromUserId?: string;
  actorUserId?: string;
  actorUser?: LegacyLikeActor | null;
  fromUser?: LegacyLikeActor | null;
  liker?: {
    id?: string;
    name?: string | null;
    age?: number | null;
    city?: string | null;
    primaryPhotoUrl?: string | null;
    isPremium?: boolean | null;
    isBlurred?: boolean | null;
    matchPercentage?: number | null;
  } | null;
};

type LegacyLikeActor = {
  id: string;
  profile?: {
    name?: string | null;
    age?: number | null;
    city?: string | null;
  } | null;
  photos?: Array<{ url?: string | null }>;
};

type IncomingLikesResponse = {
  incoming?: LegacyIncomingLike[];
};

export type LikesIncomingProfile = {
  likeId: string;
  profileId: string;
  hasLikedMe: true;
  likedAt: string | null;
  name: string;
  age: number;
  location: string;
  image: string;
};

function toIncomingProfile(item: LegacyIncomingLike): LikesIncomingProfile | null {
  if (item.liker?.id) {
    return {
      likeId: item.id,
      profileId: item.liker.id,
      hasLikedMe: true,
      likedAt: item.likedAt ?? item.createdAt ?? null,
      name: item.liker.name ?? "Member",
      age: item.liker.age ?? 0,
      location: (item.liker.city ?? "Unknown").toUpperCase(),
      image: item.liker.primaryPhotoUrl ?? FALLBACK_IMAGE
    };
  }

  const actor = item.actorUser ?? item.fromUser;
  const actorId = actor?.id ?? item.fromUserId ?? item.actorUserId;
  if (!actorId) return null;

  return {
    likeId: item.id,
    profileId: actorId,
    hasLikedMe: true,
    likedAt: item.likedAt ?? item.createdAt ?? null,
    name: actor.profile?.name ?? "Member",
    age: actor.profile?.age ?? 0,
    location: (actor.profile?.city ?? "Unknown").toUpperCase(),
    image: actor.photos?.[0]?.url ?? FALLBACK_IMAGE
  };
}

export async function fetchIncomingLikes(): Promise<LikesIncomingProfile[]> {
  const response = await apiRequest<IncomingLikesResponse>("/likes/incoming", { auth: true });
  const incoming = response.incoming ?? [];

  return incoming
    .map(toIncomingProfile)
    .filter((item): item is LikesIncomingProfile => item !== null);
}

export async function respondToIncomingLike(options: { targetUserId: string; action: "LIKE" | "PASS" }) {
  return apiRequest<{ ok: boolean; matchId: string | null; alreadyProcessed: boolean }>("/likes", {
    method: "POST",
    auth: true,
    body: JSON.stringify({
      actionId: crypto.randomUUID(),
      targetUserId: options.targetUserId,
      action: options.action
    })
  });
}
