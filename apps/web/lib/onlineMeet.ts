import { apiRequest } from "./api";

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
  return apiRequest<OnlineMeetCase>(`/online-meet-cases/${matchId}`, { auth: true });
}

export async function submitOnlineMeetSelections(matchId: string, payload: { platform: MeetPlatform; timeSlots: string[] }) {
  return apiRequest<{ ok: boolean; status: OnlineMeetStatus }>(`/online-meet-cases/${matchId}/selections`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload)
  });
}

export type OnlineMeetEmployeeCase = {
  id: string;
  matchId: string;
  status: OnlineMeetStatus;
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
  return apiRequest<{ statusView: OnlineMeetStatusView; cases: OnlineMeetEmployeeCase[] }>(`/admin/online-meets?statusView=${statusView}`, { auth: true });
}

export async function assignOnlineMeetCase(caseId: string) {
  return apiRequest(`/admin/online-meets/${caseId}/assign`, { method: "POST", auth: true });
}

export async function sendOnlineMeetOptions(caseId: string, payload: { platforms: MeetPlatform[]; timeSlots: Array<{ id: string; label: string; startsAtIso?: string | null }> }) {
  return apiRequest(`/admin/online-meets/${caseId}/options`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload)
  });
}

export async function finalizeOnlineMeet(caseId: string, payload: { finalPlatform: MeetPlatform; finalTimeSlotId: string; finalMeetingLink: string }) {
  return apiRequest(`/admin/online-meets/${caseId}/finalize`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload)
  });
}

export async function markOnlineMeetTimeout(caseId: string, nonResponderUserId: string) {
  return apiRequest(`/admin/online-meets/${caseId}/timeout`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ nonResponderUserId })
  });
}

export async function markOnlineMeetNoOverlap(caseId: string) {
  return apiRequest(`/admin/online-meets/${caseId}/no-overlap`, { method: "POST", auth: true });
}

export async function updateOnlineMeetCase(caseId: string, payload: { action: "CANCEL" | "RESCHEDULE"; reason: string; requestedByUserId?: string | null }) {
  return apiRequest(`/admin/online-meets/${caseId}/case-update`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload)
  });
}
