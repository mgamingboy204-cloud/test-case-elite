import type { MatchCard, MatchRequestType } from "@/lib/queries";
import type { MeetPlatform } from "@/lib/onlineMeet";

export type PendingAction =
  | `${string}:${MatchRequestType}`
  | `unmatch:${string}`
  | `offline:${string}`
  | `online:${string}`
  | `social:${string}`;

export type SocialCaseSnapshot = {
  id: string;
  requesterUserId: string;
  receiverUserId: string;
  status: string;
  platform: string | null;
  revealOpenedAt: string | null;
  revealExpiresAt: string | null;
  unopenedExpiresAt: string | null;
  cooldownUntil: string | null;
  canRespond: boolean;
  canSubmitHandle: boolean;
  canReveal: boolean;
};

export type OfflineMeetDraft = { cafes: string[]; timeSlots: string[] };
export type OnlineMeetDraft = { platform: MeetPlatform | null; timeSlots: string[] };

export type PhoneExchangeCase = MatchCard["phoneExchangeCase"];
