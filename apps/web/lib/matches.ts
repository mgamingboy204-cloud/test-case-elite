import { apiRequest } from "./api";

export type MatchInteractionType = "PHONE_EXCHANGE" | "OFFLINE_MEET" | "ONLINE_MEET" | "SOCIAL_EXCHANGE";
export type MatchConsentType = "PHONE_NUMBER" | "OFFLINE_MEET" | "ONLINE_MEET" | "SOCIAL_EXCHANGE";

function toConsentType(type: MatchInteractionType): MatchConsentType {
  return type === "PHONE_EXCHANGE" ? "PHONE_NUMBER" : type;
}

export async function initiateMatchInteractionRequest(options: {
  matchId: string;
  type: MatchInteractionType;
  payload?: Record<string, unknown>;
}) {
  return apiRequest<{ ok: boolean; matchId: string; type: MatchConsentType; ready: boolean; status: "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED"; message: string }>("/consent/respond", {
    method: "POST",
    auth: true,
    body: JSON.stringify({
      matchId: options.matchId,
      type: toConsentType(options.type),
      response: "YES",
      payload: options.payload
    })
  });
}

export async function respondMatchConsent(options: {
  matchId: string;
  response: "YES" | "NO";
  type: MatchConsentType;
  payload?: Record<string, unknown>;
}) {
  return apiRequest<{ ok: boolean; matchId: string; type: MatchConsentType; ready: boolean; message: string }>("/consent/respond", {
    method: "POST",
    auth: true,
    body: JSON.stringify(options)
  });
}

export async function getPhoneUnlock(matchId: string) {
  return apiRequest<{ matchId: string; users: Array<{ id: string; phone: string }> }>(`/phone-unlock/${matchId}`, { auth: true });
}

export async function getOfflineMeet(matchId: string) {
  return apiRequest<{ matchId: string; type: "OFFLINE_MEET"; payloads: Array<{ userId: string; payload: unknown }> }>(`/offline-meet/${matchId}`, { auth: true });
}

export async function getOnlineMeet(matchId: string) {
  return apiRequest<{ matchId: string; type: "ONLINE_MEET"; payloads: Array<{ userId: string; payload: unknown }> }>(`/online-meet/${matchId}`, { auth: true });
}

export async function getSocialExchange(matchId: string) {
  return apiRequest<{ matchId: string; type: "SOCIAL_EXCHANGE"; payloads: Array<{ userId: string; payload: unknown }> }>(`/social-exchange/${matchId}`, { auth: true });
}

export type SocialExchangeCase = {
  id: string;
  matchId: string;
  requesterUserId: string;
  receiverUserId: string;
  status: "REQUESTED" | "ACCEPTED" | "REJECTED" | "AWAITING_HANDLE_SUBMISSION" | "HANDLE_SUBMITTED" | "READY_TO_REVEAL" | "REVEALED" | "EXPIRED" | "COOLDOWN" | "CANCELED";
  platform: "SNAPCHAT" | "INSTAGRAM" | "LINKEDIN" | null;
  handleVisible: boolean;
  revealOpenedAt: string | null;
  revealExpiresAt: string | null;
  unopenedExpiresAt: string | null;
  cooldownUntil: string | null;
  createdAt: string;
  canRespond?: boolean;
  canSubmitHandle?: boolean;
  canReveal?: boolean;
};

export async function listSocialExchangeCases(matchId: string) {
  return apiRequest<{ cases: SocialExchangeCase[] }>(`/social-exchange-cases/${matchId}`, { auth: true });
}

export async function requestSocialExchange(matchId: string) {
  return apiRequest<{ ok: boolean; socialExchange: SocialExchangeCase }>(`/social-exchange-cases/${matchId}/request`, {
    method: "POST",
    auth: true
  });
}

export async function respondSocialExchange(caseId: string, response: "ACCEPT" | "REJECT") {
  return apiRequest<{ ok: boolean; socialExchange: SocialExchangeCase }>(`/social-exchange-cases/${caseId}/respond`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ response })
  });
}

export async function submitSocialExchangeHandle(caseId: string, platform: "Snapchat" | "Instagram" | "LinkedIn", handle: string) {
  return apiRequest<{ ok: boolean; socialExchange: SocialExchangeCase }>(`/social-exchange-cases/${caseId}/handle`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ platform, handle })
  });
}

export async function revealSocialExchange(caseId: string) {
  return apiRequest<{ ok: boolean; status: string; platform: string | null; handle: string | null; revealExpiresAt: string | null }>(`/social-exchange-cases/${caseId}/reveal`, {
    method: "POST",
    auth: true
  });
}

export async function unmatch(matchId: string) {
  return apiRequest<{ ok: boolean; matchId: string; alreadyUnmatched: boolean }>(`/matches/${matchId}`, {
    method: "DELETE",
    auth: true
  });
}
