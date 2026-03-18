import { MapPin, Video, type LucideIcon } from "lucide-react";
import type { MatchCard, MatchInteraction, MatchRequestType } from "@/lib/queries";
import type { SocialExchangeCase } from "@/lib/matches";
import type { SocialCaseSnapshot } from "@/features/matches/types";

export const interactionMeta: Array<{ type: MatchRequestType; label: string; icon: LucideIcon }> = [
  { type: "OFFLINE_MEET", label: "Offline meet", icon: MapPin },
  { type: "ONLINE_MEET", label: "Online meet", icon: Video }
];

export function normalizeSocialCase(
  input: SocialExchangeCase | MatchCard["socialExchangeCase"] | null,
  currentUserId: string
): SocialCaseSnapshot | null {
  if (!input) return null;

  const status = String(input.status);
  const requesterUserId = input.requesterUserId;
  const mineIsRequester = requesterUserId === currentUserId;

  const socialInput = input as SocialExchangeCase;
  const canRespond = typeof socialInput.canRespond === "boolean" ? socialInput.canRespond : !mineIsRequester && status === "REQUESTED";
  const canSubmitHandle =
    typeof socialInput.canSubmitHandle === "boolean"
      ? socialInput.canSubmitHandle
      : mineIsRequester && (status === "ACCEPTED" || status === "AWAITING_HANDLE_SUBMISSION");
  const canReveal = typeof socialInput.canReveal === "boolean" ? socialInput.canReveal : !mineIsRequester && (status === "READY_TO_REVEAL" || status === "REVEALED");

  return {
    id: input.id,
    requesterUserId,
    receiverUserId: input.receiverUserId,
    status,
    platform: input.platform ?? null,
    revealOpenedAt: input.revealOpenedAt ?? null,
    revealExpiresAt: input.revealExpiresAt ?? null,
    unopenedExpiresAt: input.unopenedExpiresAt ?? null,
    cooldownUntil: input.cooldownUntil ?? null,
    canRespond,
    canSubmitHandle,
    canReveal
  };
}

export function statusLabel(interaction: MatchInteraction): string {
  if (interaction.status === "ACCEPTED") return "Accepted";
  if (interaction.status === "REJECTED") return "Declined";
  if (interaction.status === "CANCELED") return "Canceled";
  return interaction.isInitiatedByMe ? "Pending response" : "Available";
}

export function toRequestPayload(type: MatchRequestType): Record<string, unknown> | undefined {
  if (type === "OFFLINE_MEET") return { note: "Concierge-managed offline meet request" };
  if (type === "ONLINE_MEET") return { note: "Concierge-managed online meet request" };
  return undefined;
}

export function toConsentType(type: MatchRequestType): "PHONE_NUMBER" | "OFFLINE_MEET" | "ONLINE_MEET" | "SOCIAL_EXCHANGE" {
  return type === "PHONE_EXCHANGE" ? "PHONE_NUMBER" : type;
}

export function toAwaitingResponse(interaction: MatchInteraction): boolean {
  return interaction.status === "PENDING" && !interaction.isInitiatedByMe;
}

export function canEditMeetSelections(status: string): boolean {
  return ["AWAITING_USER_SELECTIONS", "OPTIONS_SENT", "USER_ONE_RESPONDED", "USER_TWO_RESPONDED"].includes(status);
}
