import { apiRequest } from "./api";

export type MatchConsentType = "PHONE_NUMBER" | "OFFLINE_MEET" | "ONLINE_MEET" | "SOCIAL_EXCHANGE";

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
