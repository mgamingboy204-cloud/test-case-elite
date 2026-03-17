import { apiRequest } from "@/lib/api";
import { type LikesIncomingProfile } from "@/lib/likes";

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
  dateOfBirth?: string | null;
  locationLabel?: string | null;
  profession?: string | null;
  heightCm?: number | null;
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
  profession: string | null;
  heightLabel: string | null;
};

function toAgeFromDateOfBirth(dateOfBirth: string | null | undefined) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const now = new Date();
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age >= 18 ? age : null;
}

function toHeightLabel(heightCm: number | null | undefined) {
  if (!heightCm || heightCm < 120 || heightCm > 240) return null;
  const inches = Math.round(heightCm / 2.54);
  const feet = Math.floor(inches / 12);
  const rest = inches % 12;
  return `${feet}'${rest}" (${heightCm}cm)`;
}

export function mapLegacyFeedItemToCard(item: LegacyDiscoverFeedItem): DiscoverCard {
  const derivedAge = toAgeFromDateOfBirth(item.dateOfBirth);

  return {
    id: item.userId,
    displayName: item.name,
    age: derivedAge ?? item.age,
    locationLabel: item.locationLabel ?? item.city,
    bio: item.bioShort,
    imageUrl: item.primaryPhotoUrl,
    profession: item.profession ?? null,
    heightLabel: toHeightLabel(item.heightCm)
  };
}

export async function fetchDiscoverFeedPage(cursor?: string, limit = 10): Promise<LegacyDiscoverFeedResponse> {
  const cursorQuery = cursor ? `&cursor=${encodeURIComponent(cursor)}` : "";
  return apiRequest<LegacyDiscoverFeedResponse>(`/discover/feed?limit=${limit}${cursorQuery}`, { auth: true });
}

const FALLBACK_MATCH_IMAGE = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80";

type MatchRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED";
export type MatchRequestType = "OFFLINE_MEET" | "ONLINE_MEET" | "SOCIAL_EXCHANGE" | "PHONE_EXCHANGE";

export type MatchInteraction = {
  type: MatchRequestType;
  status: MatchRequestStatus;
  canInitiate: boolean;
  isInitiatedByMe: boolean;
  requestedAt: string | null;
};

export type MatchCard = {
  id: string;
  name: string;
  age: number | null;
  location: string;
  image: string;
  bio: string | null;
  interactions: Record<MatchRequestType, MatchInteraction>;
  offlineMeetCase: {
    id: string;
    status: string;
    responseDeadlineAt: string | null;
    cooldownUntil: string | null;
    finalCafe: { name: string } | null;
    finalTimeSlot: { label: string } | null;
  } | null;
  onlineMeetCase: {
    id: string;
    status: string;
    responseDeadlineAt: string | null;
    cooldownUntil: string | null;
    finalPlatform: string | null;
    finalTimeSlot: { label: string } | null;
  } | null;
  socialExchangeCase: {
    id: string;
    requesterUserId: string;
    receiverUserId: string;
    status: string;
    platform: string | null;
    revealOpenedAt: string | null;
    revealExpiresAt: string | null;
    unopenedExpiresAt: string | null;
    cooldownUntil: string | null;
  } | null;
  phoneExchangeCase: {
    id: string;
    requesterUserId: string;
    receiverUserId: string;
    status: string;
    requestedAt: string;
    acceptedAt: string | null;
    rejectedAt: string | null;
    mutuallyConfirmedAt: string | null;
    revealedAt: string | null;
    canRequest: boolean;
    canRespond: boolean;
    canReveal: boolean;
  } | null;
};

type ApiMatch = {
  id: string;
  user: {
    name: string;
    age: number | null;
    city: string | null;
    locationLabel: string | null;
    bioShort: string | null;
    primaryPhotoUrl: string | null;
  };
  interactionRequests?: Partial<Record<MatchRequestType, MatchInteraction>>;
  offlineMeetCase?: MatchCard["offlineMeetCase"];
  onlineMeetCase?: MatchCard["onlineMeetCase"];
  socialExchangeCase?: MatchCard["socialExchangeCase"];
  phoneExchangeCase?: MatchCard["phoneExchangeCase"];
};

export async function fetchMatches(): Promise<MatchCard[]> {
  const response = await apiRequest<{ matches: ApiMatch[] }>("/matches", { auth: true });
  const seen = new Set<string>();

  return response.matches
    .filter((match) => {
      if (seen.has(match.id)) return false;
      seen.add(match.id);
      return true;
    })
    .map((match) => ({
      id: match.id,
      name: match.user.name,
      age: match.user.age,
      location: (match.user.locationLabel ?? match.user.city ?? "Private Location").toUpperCase(),
      image: match.user.primaryPhotoUrl ?? FALLBACK_MATCH_IMAGE,
      bio: match.user.bioShort,
      offlineMeetCase: match.offlineMeetCase ?? null,
      onlineMeetCase: match.onlineMeetCase ?? null,
      socialExchangeCase: match.socialExchangeCase ?? null,
      phoneExchangeCase: match.phoneExchangeCase ?? null,
      interactions: {
        OFFLINE_MEET: match.interactionRequests?.OFFLINE_MEET ?? {
          type: "OFFLINE_MEET",
          status: "PENDING",
          canInitiate: true,
          isInitiatedByMe: false,
          requestedAt: null
        },
        ONLINE_MEET: match.interactionRequests?.ONLINE_MEET ?? {
          type: "ONLINE_MEET",
          status: "PENDING",
          canInitiate: true,
          isInitiatedByMe: false,
          requestedAt: null
        },
        SOCIAL_EXCHANGE: match.interactionRequests?.SOCIAL_EXCHANGE ?? {
          type: "SOCIAL_EXCHANGE",
          status: "PENDING",
          canInitiate: true,
          isInitiatedByMe: false,
          requestedAt: null
        },
        PHONE_EXCHANGE: match.interactionRequests?.PHONE_EXCHANGE ?? {
          type: "PHONE_EXCHANGE",
          status: "PENDING",
          canInitiate: true,
          isInitiatedByMe: false,
          requestedAt: null
        }
      }
    }));
}

export interface NotificationApiItem {
  id: string;
  type:
    | "NEW_LIKE"
    | "NEW_MATCH"
    | "NEW_MESSAGE"
    | "SYSTEM_PROMO"
    | "PROFILE_VIEW"
    | "VIDEO_VERIFICATION_UPDATE"
    | "OFFLINE_MEET_REQUEST"
    | "OFFLINE_MEET_ACCEPTED"
    | "OFFLINE_MEET_OPTIONS_SENT"
    | "OFFLINE_MEET_TIMEOUT"
    | "OFFLINE_MEET_NO_OVERLAP"
    | "OFFLINE_MEET_FINALIZED"
    | "OFFLINE_MEET_RESCHEDULE_UPDATE"
    | "ONLINE_MEET_REQUEST"
    | "ONLINE_MEET_ACCEPTED"
    | "ONLINE_MEET_OPTIONS_SENT"
    | "ONLINE_MEET_TIMEOUT"
    | "ONLINE_MEET_NO_OVERLAP"
    | "ONLINE_MEET_FINALIZED"
    | "ONLINE_MEET_RESCHEDULE_UPDATE"
    | "SOCIAL_EXCHANGE_REQUEST"
    | "SOCIAL_EXCHANGE_ACCEPTED"
    | "SOCIAL_EXCHANGE_REJECTED"
    | "SOCIAL_EXCHANGE_HANDLE_READY"
    | "SOCIAL_EXCHANGE_VIEWED"
    | "SOCIAL_EXCHANGE_EXPIRED"
    | "SOCIAL_EXCHANGE_RESEND_AVAILABLE"
    | "PHONE_EXCHANGE_REQUEST"
    | "PHONE_EXCHANGE_ACCEPTED"
    | "PHONE_EXCHANGE_REJECTED"
    | "PHONE_EXCHANGE_MUTUAL_CONSENT_CONFIRMED"
    | "PHONE_EXCHANGE_REVEALED";
  eventType?:
    | "LIKE_RECEIVED"
    | "MATCH_CREATED"
    | "INTERACTION_REQUEST_RECEIVED"
    | "INTERACTION_REQUEST_ACCEPTED"
    | "INTERACTION_REQUEST_REJECTED"
    | "OFFLINE_MEET_OPTIONS_SENT"
    | "OFFLINE_MEET_TIMEOUT"
    | "OFFLINE_MEET_NO_OVERLAP"
    | "OFFLINE_MEET_FINALIZED"
    | "ONLINE_MEET_OPTIONS_SENT"
    | "ONLINE_MEET_TIMEOUT"
    | "ONLINE_MEET_NO_OVERLAP"
    | "ONLINE_MEET_FINALIZED"
    | "SOCIAL_EXCHANGE_REQUEST"
    | "SOCIAL_EXCHANGE_READY"
    | "SOCIAL_EXCHANGE_EXPIRED"
    | "PHONE_EXCHANGE_REQUEST"
    | "PHONE_EXCHANGE_CONFIRMED"
    | "VERIFICATION_ASSIGNED"
    | "VERIFICATION_APPROVED"
    | "VERIFICATION_REJECTED"
    | "PAYMENT_ISSUE"
    | "MEMBERSHIP_UPDATE";
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
  eventType?: NotificationApiItem["eventType"];
  title: string;
  message: string;
  timestamp: string;
  image: string;
  isUnread: boolean;
  deepLinkUrl?: string | null;
}

const FALLBACK_ALERT_IMAGE =
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&auto=format&fit=crop&q=80";

function toAlert(item: NotificationApiItem): Alert {
  const conciergeTypes = new Set(["SYSTEM_PROMO", "OFFLINE_MEET_REQUEST", "OFFLINE_MEET_ACCEPTED", "OFFLINE_MEET_OPTIONS_SENT", "OFFLINE_MEET_TIMEOUT", "OFFLINE_MEET_NO_OVERLAP", "OFFLINE_MEET_FINALIZED", "OFFLINE_MEET_RESCHEDULE_UPDATE", "ONLINE_MEET_REQUEST", "ONLINE_MEET_ACCEPTED", "ONLINE_MEET_OPTIONS_SENT", "ONLINE_MEET_TIMEOUT", "ONLINE_MEET_NO_OVERLAP", "ONLINE_MEET_FINALIZED", "ONLINE_MEET_RESCHEDULE_UPDATE", "SOCIAL_EXCHANGE_REQUEST", "SOCIAL_EXCHANGE_ACCEPTED", "SOCIAL_EXCHANGE_REJECTED", "SOCIAL_EXCHANGE_HANDLE_READY", "SOCIAL_EXCHANGE_VIEWED", "SOCIAL_EXCHANGE_EXPIRED", "SOCIAL_EXCHANGE_RESEND_AVAILABLE", "PHONE_EXCHANGE_REQUEST", "PHONE_EXCHANGE_ACCEPTED", "PHONE_EXCHANGE_REJECTED", "PHONE_EXCHANGE_MUTUAL_CONSENT_CONFIRMED", "PHONE_EXCHANGE_REVEALED"]);
  const normalizedType = item.type === "NEW_MATCH" ? "CONNECTION" : conciergeTypes.has(item.type) ? "CONCIERGE" : "INTEREST";
  const title =
    item.title ??
    (item.type === "NEW_MATCH" ? "New Match" : item.type === "NEW_LIKE" ? "New Interest" : item.type === "SYSTEM_PROMO" ? "VAEL Update" : "Update");
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
    isUnread: !item.isRead,
    eventType: item.eventType,
    deepLinkUrl: item.deepLinkUrl
  };
}

export async function fetchAlerts(): Promise<Alert[]> {
  const response = await apiRequest<{ notifications: NotificationApiItem[] }>("/notifications", { auth: true });
  const deduped = Array.from(new Map(response.notifications.map((item) => [item.id, item])).values());
  return deduped.map(toAlert);
}

export type ProfileViewModel = {
  name: string;
  age: number | null;
  dateOfBirth: string | null;
  gender: "MALE" | "FEMALE" | "NON_BINARY" | "OTHER" | null;
  location: string;
  place: string;
  image: string | null;
  profession: string;
  height: string | null;
  heightCm: number | null;
  story: string;
  bio: string;
  subscription: {
    tier: string;
    status: string;
    paymentPlan?: string | null;
    paymentAmount?: number | null;
    startedAt?: string | null;
    endsAt?: string | null;
    paidAt?: string | null;
    renewalMode?: "MANUAL" | "AUTO";
  };
  assignedExecutive: {
    id: string;
    name: string;
    assignedAt: string | null;
    verificationStatus: string;
  } | null;
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
  viewModel: {
    name?: string;
    dateOfBirth?: string | null;
    age?: number | null;
    gender?: ProfileViewModel["gender"];
    location?: string;
    place?: string;
    profession?: string;
    height?: string;
    heightCm?: number | null;
    story?: string;
    bio?: string;
    subscription?: ProfileViewModel["subscription"];
    assignedExecutive?: ProfileViewModel["assignedExecutive"];
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
  const vm = data.viewModel ?? {};
  const image = vm.photos?.[0]?.url ?? FALLBACK_PROFILE_IMAGE;
  return {
    name: vm.name ?? "",
    age: vm.age ?? null,
    dateOfBirth: vm.dateOfBirth ?? null,
    gender: vm.gender ?? null,
    location: vm.location ?? "",
    place: vm.place ?? "",
    image,
    profession: vm.profession ?? "",
    height: vm.height ?? null,
    heightCm: vm.heightCm ?? null,
    story: vm.story ?? "",
    bio: vm.bio ?? "",
    subscription: vm.subscription ?? { tier: "FREE", status: "INACTIVE" },
    assignedExecutive: vm.assignedExecutive ?? null,
    settings: vm.settings ?? {
      pushNotificationsEnabled: true,
      profileVisible: true,
      showOnlineStatus: true,
      discoverableByPremiumOnly: false
    },
    photos: vm.photos ?? []
  };
}
