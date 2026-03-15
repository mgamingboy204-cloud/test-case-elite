import { apiRequest } from "./api";

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
  return apiRequest<OfflineMeetCase>(`/offline-meet-cases/${matchId}`, { auth: true });
}

export async function submitOfflineMeetSelections(matchId: string, cafes: string[], timeSlots: string[]) {
  return apiRequest<{ ok: boolean; status: OfflineMeetStatus }>(`/offline-meet-cases/${matchId}/selections`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ cafes, timeSlots })
  });
}

export type OfflineMeetEmployeeCase = {
  id: string;
  matchId: string;
  status: OfflineMeetStatus;
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

export async function listOfflineMeetCasesForEmployee() {
  return apiRequest<{ cases: OfflineMeetEmployeeCase[] }>("/admin/offline-meets", { auth: true });
}

export async function assignOfflineMeetCase(caseId: string) {
  return apiRequest(`/admin/offline-meets/${caseId}/assign`, { method: "POST", auth: true });
}

export async function sendOfflineMeetOptions(caseId: string, payload: { cafes: Array<{ id: string; name: string; address: string }>; timeSlots: Array<{ id: string; label: string; startsAtIso?: string | null }> }) {
  return apiRequest(`/admin/offline-meets/${caseId}/options`, { method: "POST", auth: true, body: JSON.stringify(payload) });
}

export async function finalizeOfflineMeet(caseId: string, finalCafeId: string, finalTimeSlotId: string) {
  return apiRequest(`/admin/offline-meets/${caseId}/finalize`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ finalCafeId, finalTimeSlotId })
  });
}

export async function markOfflineMeetTimeout(caseId: string, nonResponderUserId: string) {
  return apiRequest(`/admin/offline-meets/${caseId}/timeout`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ nonResponderUserId })
  });
}

export async function markOfflineMeetNoOverlap(caseId: string) {
  return apiRequest(`/admin/offline-meets/${caseId}/no-overlap`, { method: "POST", auth: true });
}

export async function updateOfflineMeetCase(caseId: string, payload: { action: "CANCEL" | "RESCHEDULE"; reason: string; requestedByUserId?: string | null }) {
  return apiRequest(`/admin/offline-meets/${caseId}/case-update`, {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload)
  });
}
