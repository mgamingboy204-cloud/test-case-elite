import { apiRequestAuth } from "./api";
import { API_ENDPOINTS } from "./api/endpoints";

export type VerificationQueueView = "ACTIVE" | "ESCALATED" | "COMPLETED" | "REJECTED" | "ALL";

export type VerificationRequestStatus = "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "REJECTED" | "ESCALATED";

export type WorkerVerificationRequest = {
  id: string;
  status: VerificationRequestStatus;
  assignedEmployeeId: string | null;
  meetUrl: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  assignedAt: string | null;
  escalationRequestedAt: string | null;
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
  return apiRequestAuth<{ statusView: VerificationQueueView; requests: WorkerVerificationRequest[] }>(API_ENDPOINTS.ops.verification.list(statusView));
}

export async function assignVerificationRequest(requestId: string) {
  return apiRequestAuth<{ request: WorkerVerificationRequest }>(API_ENDPOINTS.ops.verification.assign(requestId), {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function startVerificationRequest(requestId: string, meetUrl: string) {
  return apiRequestAuth<{ request: WorkerVerificationRequest }>(API_ENDPOINTS.ops.verification.start(requestId), {
    method: "POST",
    body: JSON.stringify({ meetUrl })
  });
}

export async function approveVerificationRequest(requestId: string) {
  return apiRequestAuth<{ request: WorkerVerificationRequest }>(API_ENDPOINTS.ops.verification.approve(requestId), {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function rejectVerificationRequest(requestId: string, reason: string) {
  return apiRequestAuth<{ request: WorkerVerificationRequest }>(API_ENDPOINTS.ops.verification.reject(requestId), {
    method: "POST",
    body: JSON.stringify({ reason })
  });
}
