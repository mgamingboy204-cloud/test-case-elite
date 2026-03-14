import { apiRequest } from "@/lib/api";
import { fetchIncomingLikes, type LikesIncomingProfile } from "@/lib/likes";

export const queryKeys = {
  discoverFeed: ["discover-feed"] as const,
  likesIncoming: ["likes-incoming"] as const,
  matches: ["matches"] as const,
  alerts: ["alerts"] as const,
  profile: ["profile"] as const
};

export type LegacyDiscoverFeedItem = {
  userId: string;
  name: string;
  age: number;
  city: string;
  bioShort: string;
  primaryPhotoUrl: string | null;
};

export type LegacyDiscoverFeedResponse = {
  items: LegacyDiscoverFeedItem[];
  nextCursor?: string;
};

export type DiscoverCard = {
  id: string;
  displayName: string;
  age: number;
  locationLabel: string;
  bio: string;
  imageUrl: string | null;
};

export function mapLegacyFeedItemToCard(item: LegacyDiscoverFeedItem): DiscoverCard {
  return {
    id: item.userId,
    displayName: item.name,
    age: item.age,
    locationLabel: item.city,
    bio: item.bioShort,
    imageUrl: item.primaryPhotoUrl
  };
}

export async function fetchDiscoverFeedPage(cursor?: string, limit = 10): Promise<LegacyDiscoverFeedResponse> {
  const cursorQuery = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
  return apiRequest<LegacyDiscoverFeedResponse>(`/discover/feed?limit=${limit}${cursorQuery}`, { auth: true });
}

const FALLBACK_MATCH_IMAGE = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80";

export type MatchCard = {
  id: string;
  name: string;
  age: number;
  location: string;
  image: string;
};

export async function fetchMatches(): Promise<MatchCard[]> {
  const response = await apiRequest<{ matches: Array<{ id: string; user: { name: string; city: string | null; primaryPhotoUrl: string | null } }> }>("/matches", { auth: true });

  return response.matches.map((match) => ({
    id: match.id,
    name: match.user.name,
    age: 0,
    location: (match.user.city ?? "Unknown").toUpperCase(),
    image: match.user.primaryPhotoUrl ?? FALLBACK_MATCH_IMAGE
  }));
}

export async function fetchLikesIncoming(): Promise<LikesIncomingProfile[]> {
  return fetchIncomingLikes();
}

export interface NotificationApiItem {
  id: string;
  type: "NEW_LIKE" | "NEW_MATCH" | "NEW_MESSAGE" | "SYSTEM_PROMO" | "PROFILE_VIEW" | "VIDEO_VERIFICATION_UPDATE";
  isRead: boolean;
  createdAt: string;
  title?: string | null;
  message?: string | null;
  deepLinkUrl?: string | null;
  imageUrl?: string | null;
  actor: { photos: Array<{ url: string }> } | null;
}

export interface Alert {
  id: string;
  type: "INTEREST" | "CONNECTION" | "CONCIERGE";
  title: string;
  message: string;
  timestamp: string;
  image: string;
  isUnread: boolean;
  targetId?: number;
}

const FALLBACK_ALERT_IMAGE =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80";

function toAlert(item: NotificationApiItem): Alert {
  const normalizedType = item.type === "NEW_MATCH" ? "CONNECTION" : item.type === "SYSTEM_PROMO" ? "CONCIERGE" : "INTEREST";
  const title =
    item.title ??
    (item.type === "NEW_MATCH" ? "New Match" : item.type === "NEW_LIKE" ? "New Interest" : item.type === "SYSTEM_PROMO" ? "Elite Update" : "Update");
  const message =
    item.message ??
    (item.type === "NEW_MATCH"
      ? "A new match is waiting for your move."
      : item.type === "NEW_LIKE"
        ? "A member showed interest in your profile."
        : item.type === "SYSTEM_PROMO"
          ? "Concierge shared a new update for you."
          : "You have a new notification.");

  return {
    id: item.id,
    type: normalizedType,
    title,
    message,
    timestamp: new Date(item.createdAt).toLocaleDateString(),
    image: item.imageUrl ?? item.actor?.photos[0]?.url ?? FALLBACK_ALERT_IMAGE,
    isUnread: !item.isRead
  };
}

export async function fetchAlerts(): Promise<Alert[]> {
  const response = await apiRequest<{ notifications: NotificationApiItem[] }>("/notifications", { auth: true });
  return response.notifications.map(toAlert);
}

export type ProfileViewModel = {
  name: string;
  age: number;
  location: string;
  image: string;
  profession: string;
  height: string;
  story: string;
  subscription: { tier: string; status: string };
  settings: {
    pushNotificationsEnabled: boolean;
    profileVisible: boolean;
    showOnlineStatus: boolean;
    discoverableByPremiumOnly: boolean;
  };
  photos: Array<{ id: string; url: string; photoIndex?: number | null }>;
};

const FALLBACK_PROFILE_IMAGE = "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80";
type RawProfileResponse = {
  viewModel?: {
    name?: string;
    location?: string;
    profession?: string;
    height?: string;
    story?: string;
    subscription?: { tier: string; status: string };
    settings?: ProfileViewModel["settings"];
    photos?: Array<{ id: string; url: string; photoIndex?: number | null }>;
  };
  profile?: {
    name?: string;
    age?: number;
    city?: string;
    profession?: string;
    bioShort?: string;
  };
  photos?: Array<{ id: string; url: string; photoIndex?: number | null }>;
};

export async function fetchProfile(): Promise<ProfileViewModel> {
  const data = await apiRequest<RawProfileResponse>("/profile", { auth: true });
  return {
    name: data.viewModel?.name ?? data.profile?.name ?? "",
    age: data.profile?.age ?? 27,
    location: data.viewModel?.location ?? data.profile?.city ?? "",
    image: data.photos?.[0]?.url ?? FALLBACK_PROFILE_IMAGE,
    profession: data.viewModel?.profession ?? data.profile?.profession ?? "",
    height: data.viewModel?.height ?? "5'8\"",
    story: data.viewModel?.story ?? data.profile?.bioShort ?? "",
    subscription: data.viewModel?.subscription ?? { tier: "FREE", status: "INACTIVE" },
    settings: data.viewModel?.settings ?? {
      pushNotificationsEnabled: true,
      profileVisible: true,
      showOnlineStatus: true,
      discoverableByPremiumOnly: false
    },
    photos: data.viewModel?.photos ?? data.photos ?? []
  };
}
