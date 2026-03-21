import { apiRequestAuth } from "./api";
import { API_ENDPOINTS } from "./api/endpoints";

export type OfflineMeetStatus =
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

export type OfflineMeetCase = {
  id: string;
  matchId: string;
  status: OfflineMeetStatus;
  assignedEmployeeId: string | null;
  responseDeadlineAt: string | null;
  cooldownUntil: string | null;
  finalCafe: { id: string; name: string; address: string } | null;
  finalTimeSlot: { id: string; label: string; startsAtIso?: string | null } | null;
  timeoutUserId: string | null;
  users: {
    me: { id: string; name: string; locationLabel: string };
    other: { id: string; name: string; locationLabel: string };
  };
  options: {
    cafes: Array<{ id: string; name: string; address: string }>;
    timeSlots: Array<{ id: string; label: string; startsAtIso?: string | null }>;
  };
  selections: {
    mine: { cafes: string[]; timeSlots: string[] };
    other: { cafes: string[]; timeSlots: string[] };
  };
};

export async function fetchOfflineMeetCase(matchId: string) {
  return apiRequestAuth<OfflineMeetCase>(API_ENDPOINTS.offlineMeet.get(matchId));
}

export async function submitOfflineMeetSelections(matchId: string, cafes: string[], timeSlots: string[]) {
  return apiRequestAuth<{ ok: boolean; status: OfflineMeetStatus }>(API_ENDPOINTS.offlineMeet.submitSelections(matchId), {
    method: "POST",
    body: JSON.stringify({ cafes, timeSlots })
  });
}

export type OfflineMeetEmployeeCase = {
  id: string;
  matchId: string;
  status: OfflineMeetStatus;
  createdAt: string;
  updatedAt: string;
  assignedEmployeeId: string | null;
  responseDeadlineAt: string | null;
  cooldownUntil: string | null;
  finalCafe: { id: string; name: string; address: string } | null;
  finalTimeSlot: { id: string; label: string } | null;
  users: Array<{ id: string; name: string; locationLabel: string; city: string | null; profession: string | null; photoUrl: string | null }>;
  options: {
    cafes: Array<{ id: string; name: string; address: string }>;
    timeSlots: Array<{ id: string; label: string; startsAtIso?: string | null }>;
  };
  selections: {
    requester: { cafes: string[]; timeSlots: string[] };
    receiver: { cafes: string[]; timeSlots: string[] };
  };
};

export type OfflineMeetStatusView = "ACTIVE" | "FINALIZED" | "CONFLICT" | "TIMEOUT" | "CANCELED" | "ALL";

export async function listOfflineMeetCasesForEmployee(statusView: OfflineMeetStatusView = "ACTIVE") {
  return apiRequestAuth<{ statusView: OfflineMeetStatusView; cases: OfflineMeetEmployeeCase[] }>(API_ENDPOINTS.offlineMeet.employeeActions.list(statusView));
}

export async function assignOfflineMeetCase(caseId: string) {
  return apiRequestAuth<{ case: OfflineMeetEmployeeCase }>(API_ENDPOINTS.offlineMeet.employeeActions.assign(caseId), { method: "POST" });
}

export async function sendOfflineMeetOptions(caseId: string, payload: { cafes: Array<{ id: string; name: string; address: string }>; timeSlots: Array<{ id: string; label: string; startsAtIso?: string | null }> }) {
  return apiRequestAuth<{ case: OfflineMeetEmployeeCase }>(API_ENDPOINTS.offlineMeet.employeeActions.sendOptions(caseId), { method: "POST", body: JSON.stringify(payload) });
}

export async function finalizeOfflineMeet(caseId: string, finalCafeId: string, finalTimeSlotId: string) {
  return apiRequestAuth<{ case: OfflineMeetEmployeeCase }>(API_ENDPOINTS.offlineMeet.employeeActions.finalize(caseId), {
    method: "POST",
    body: JSON.stringify({ finalCafeId, finalTimeSlotId })
  });
}

export async function markOfflineMeetTimeout(caseId: string, nonResponderUserId: string) {
  return apiRequestAuth<{ case: OfflineMeetEmployeeCase }>(API_ENDPOINTS.offlineMeet.employeeActions.timeout(caseId), {
    method: "POST",
    body: JSON.stringify({ nonResponderUserId })
  });
}

export async function markOfflineMeetNoOverlap(caseId: string) {
  return apiRequestAuth<{ case: OfflineMeetEmployeeCase }>(API_ENDPOINTS.offlineMeet.employeeActions.noOverlap(caseId), { method: "POST" });
}

export async function updateOfflineMeetCase(caseId: string, payload: { action: "CANCEL" | "RESCHEDULE"; reason: string; requestedByUserId?: string | null }) {
  return apiRequestAuth<{ case: OfflineMeetEmployeeCase }>(API_ENDPOINTS.offlineMeet.employeeActions.caseUpdate(caseId), {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
