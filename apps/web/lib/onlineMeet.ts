import { apiRequestAuth } from "./api";
import { API_ENDPOINTS } from "./api/endpoints";

export type OnlineMeetStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "EMPLOYEE_PREPARING_OPTIONS"
  | "OPTIONS_SENT"
  | "AWAITING_USER_SELECTIONS"
  | "USER_ONE_RESPONDED"
  | "USER_TWO_RESPONDED"
  | "READY_FOR_FINALIZATION"
  | "FINALIZED"
  | "NO_RESPONSE_TIMEOUT"
  | "NO_COMPATIBLE_OVERLAP"
  | "COOLDOWN"
  | "CANCELED"
  | "RESCHEDULE_REQUESTED";

export type MeetPlatform = "ZOOM" | "GOOGLE_MEET";

export type OnlineMeetCase = {
  id: string;
  matchId: string;
  status: OnlineMeetStatus;
  assignedEmployeeId: string | null;
  responseDeadlineAt: string | null;
  cooldownUntil: string | null;
  timeoutUserId: string | null;
  finalPlatform: MeetPlatform | null;
  finalTimeSlot: { id: string; label: string } | null;
  finalMeetingLink: string | null;
  options: {
    platforms: MeetPlatform[];
    timeSlots: Array<{ id: string; label: string; startsAtIso?: string | null }>;
  };
  selections: {
    mine: { platform: MeetPlatform | null; timeSlots: string[] };
    other: { platform: MeetPlatform | null; timeSlots: string[] };
  };
};

export async function fetchOnlineMeetCase(matchId: string) {
  return apiRequestAuth<OnlineMeetCase>(API_ENDPOINTS.onlineMeet.get(matchId));
}

export async function submitOnlineMeetSelections(matchId: string, payload: { platform: MeetPlatform; timeSlots: string[] }) {
  return apiRequestAuth<{ ok: boolean; status: OnlineMeetStatus }>(API_ENDPOINTS.onlineMeet.submitSelections(matchId), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export type OnlineMeetEmployeeCase = {
  id: string;
  matchId: string;
  status: OnlineMeetStatus;
  createdAt: string;
  updatedAt: string;
  assignedEmployeeId: string | null;
  responseDeadlineAt: string | null;
  cooldownUntil: string | null;
  finalPlatform: MeetPlatform | null;
  finalTimeSlot: { id: string; label: string } | null;
  finalMeetingLink: string | null;
  users: Array<{ id: string; name: string; locationLabel: string; city: string | null; profession: string | null; photoUrl: string | null }>;
  options: {
    platforms: MeetPlatform[];
    timeSlots: Array<{ id: string; label: string; startsAtIso?: string | null }>;
  };
  selections: {
    requester: { platform: MeetPlatform | null; timeSlots: string[] };
    receiver: { platform: MeetPlatform | null; timeSlots: string[] };
  };
};

export type OnlineMeetStatusView = "ACTIVE" | "FINALIZED" | "CONFLICT" | "TIMEOUT" | "CANCELED" | "ALL";

export async function listOnlineMeetCasesForEmployee(statusView: OnlineMeetStatusView = "ACTIVE") {
  return apiRequestAuth<{ statusView: OnlineMeetStatusView; cases: OnlineMeetEmployeeCase[] }>(API_ENDPOINTS.onlineMeet.employeeActions.list(statusView));
}

export async function assignOnlineMeetCase(caseId: string) {
  return apiRequestAuth<{ case: OnlineMeetEmployeeCase }>(API_ENDPOINTS.onlineMeet.employeeActions.assign(caseId), { method: "POST" });
}

export async function sendOnlineMeetOptions(caseId: string, payload: { platforms: MeetPlatform[]; timeSlots: Array<{ id: string; label: string; startsAtIso?: string | null }> }) {
  return apiRequestAuth<{ case: OnlineMeetEmployeeCase }>(API_ENDPOINTS.onlineMeet.employeeActions.sendOptions(caseId), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function finalizeOnlineMeet(caseId: string, payload: { finalPlatform: MeetPlatform; finalTimeSlotId: string; finalMeetingLink: string }) {
  return apiRequestAuth<{ case: OnlineMeetEmployeeCase }>(API_ENDPOINTS.onlineMeet.employeeActions.finalize(caseId), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function markOnlineMeetTimeout(caseId: string, nonResponderUserId: string) {
  return apiRequestAuth<{ case: OnlineMeetEmployeeCase }>(API_ENDPOINTS.onlineMeet.employeeActions.timeout(caseId), {
    method: "POST",
    body: JSON.stringify({ nonResponderUserId })
  });
}

export async function markOnlineMeetNoOverlap(caseId: string) {
  return apiRequestAuth<{ case: OnlineMeetEmployeeCase }>(API_ENDPOINTS.onlineMeet.employeeActions.noOverlap(caseId), { method: "POST" });
}

export async function updateOnlineMeetCase(caseId: string, payload: { action: "CANCEL" | "RESCHEDULE"; reason: string; requestedByUserId?: string | null }) {
  return apiRequestAuth<{ case: OnlineMeetEmployeeCase }>(API_ENDPOINTS.onlineMeet.employeeActions.caseUpdate(caseId), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
