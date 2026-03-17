import { apiRequestAuth } from "./api";

export type VerificationQueueView = "ACTIVE" | "COMPLETED" | "REJECTED" | "TIMEOUT" | "ALL";

export type VerificationRequestStatus = "REQUESTED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "TIMED_OUT";

export type WorkerVerificationRequest = {
  id: string;
  status: VerificationRequestStatus;
  assignedEmployeeId: string | null;
  meetUrl: string | null;
  reason: string | null;
  createdAt: string;
  assignedAt: string | null;
  user: {
    id: string;
    phone: string;
    email: string | null;
  };
};

export function isValidGoogleMeetUrl(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && parsed.hostname === "meet.google.com" && parsed.pathname.length > 1;
  } catch {
    return false;
  }
}

export async function listVerificationRequestsForWorker(statusView: VerificationQueueView = "ACTIVE") {
  return apiRequestAuth<{ statusView: VerificationQueueView; requests: WorkerVerificationRequest[] }>(`/admin/verification-requests?statusView=${statusView}`);
}

export async function assignVerificationRequest(requestId: string) {
  return apiRequestAuth<{ request: WorkerVerificationRequest }>(`/admin/verification-requests/${requestId}/assign`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function startVerificationRequest(requestId: string, meetUrl: string) {
  return apiRequestAuth<{ request: WorkerVerificationRequest }>(`/admin/verification-requests/${requestId}/start`, {
    method: "POST",
    body: JSON.stringify({ meetUrl })
  });
}

export async function approveVerificationRequest(requestId: string) {
  return apiRequestAuth<{ request: WorkerVerificationRequest }>(`/admin/verification-requests/${requestId}/approve`, {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function rejectVerificationRequest(requestId: string, reason: string) {
  return apiRequestAuth<{ request: WorkerVerificationRequest }>(`/admin/verification-requests/${requestId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}
