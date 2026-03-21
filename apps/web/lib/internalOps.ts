import { apiRequestAuth } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export type StaffMember = {
  id: string;
  employeeId: string | null;
  name: string;
  phone: string;
  email: string | null;
  role: "EMPLOYEE" | "ADMIN";
  isAdmin: boolean;
  mustResetPassword: boolean;
  isActive: boolean;
  createdAt: string;
  lastActiveAt: string;
};

export type AdminMember = {
  id: string;
  phone: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  role: "USER" | "EMPLOYEE" | "ADMIN";
  isAdmin: boolean;
  status: string;
  onboardingStep: string;
  videoVerificationStatus: string;
  paymentStatus: string;
  profileCompletedAt: string | null;
  deactivatedAt: string | null;
  deletedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  profile: { name: string | null } | null;
};

export type AssignedCase = {
  id: string;
  caseType: "VERIFICATION" | "OFFLINE_MEET" | "ONLINE_MEET";
  status: string;
  assignedAt: string | null;
  updatedAt: string;
  deskRoute: string;
  summary: string;
  participants: Array<{ id: string; name: string }>;
};

export type CaseActivityEntry = {
  id: string;
  action: string;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    role: string;
    employeeId: string | null;
  } | null;
  body: string | null;
  metadata: Record<string, unknown>;
};

export type OpsEscalation = {
  id: string;
  type: "VERIFICATION_WHATSAPP";
  status: string;
  requestedAt: string;
  updatedAt: string;
  assignedEmployeeId: string | null;
  member: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
  };
};

export async function fetchEmployeeDashboard() {
  return apiRequestAuth<{
    pendingVerificationRequests: number;
    myVerificationCases: number;
    myOfflineCases: number;
    myOnlineCases: number;
    assignedMembers: number;
    openEscalations: number;
    totalOwnedCases: number;
  }>(API_ENDPOINTS.employee.dashboard);
}

export async function fetchAssignedCases() {
  return apiRequestAuth<{ cases: AssignedCase[] }>(API_ENDPOINTS.employee.assignedCases);
}

export async function fetchEmployeeEscalations() {
  return apiRequestAuth<{ escalations: OpsEscalation[] }>(API_ENDPOINTS.employee.escalations);
}

export async function fetchAdminEscalations() {
  return apiRequestAuth<{
    verification: OpsEscalation[];
    reports: Array<{
      id: string;
      reason: string;
      details: string | null;
      createdAt: string;
      reporter: { id: string; name: string; phone: string };
      reportedUser: { id: string; name: string; phone: string };
    }>;
    refunds: Array<{
      id: string;
      requestedAt: string;
      eligibleAt: string;
      member: { id: string; name: string; phone: string; email: string | null };
      reason: string | null;
    }>;
  }>(API_ENDPOINTS.admin.escalations);
}

export async function fetchAdminAuditLogs(limit = 100) {
  return apiRequestAuth<{
    logs: Array<{
      id: string;
      action: string;
      targetType: string;
      targetId: string;
      metadata: Record<string, unknown>;
      createdAt: string;
      actor: { id: string; name: string; role: string; employeeId: string | null } | null;
    }>;
  }>(`${API_ENDPOINTS.admin.auditLogs}?limit=${limit}`);
}

export async function fetchStaffMembers() {
  return apiRequestAuth<{ staff: StaffMember[] }>(API_ENDPOINTS.admin.staff.list);
}

export async function createStaffMember(input: {
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone: string;
  email?: string | null;
  role: "EMPLOYEE" | "ADMIN";
}) {
  return apiRequestAuth<{
    staff: {
      id: string;
      employeeId: string | null;
      role: "EMPLOYEE" | "ADMIN";
      email: string | null;
      phone: string;
      mustResetPassword: boolean;
    };
    temporaryPassword: string;
  }>(API_ENDPOINTS.admin.staff.create, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function deactivateStaffMember(staffUserId: string) {
  return apiRequestAuth<{ id: string; active: boolean }>(API_ENDPOINTS.admin.staff.deactivate(staffUserId), {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function reactivateStaffMember(staffUserId: string) {
  return apiRequestAuth<{ id: string; active: boolean }>(API_ENDPOINTS.admin.staff.reactivate(staffUserId), {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function fetchAdminUsers() {
  return apiRequestAuth<{ users: AdminMember[] }>(API_ENDPOINTS.admin.users);
}

export async function fetchCaseActivity(caseType: "VERIFICATION" | "OFFLINE_MEET" | "ONLINE_MEET", caseId: string) {
  return apiRequestAuth<{
    caseType: string;
    caseId: string;
    entries: CaseActivityEntry[];
  }>(API_ENDPOINTS.ops.caseActivity(caseType, caseId));
}

export async function addCaseNote(caseType: "VERIFICATION" | "OFFLINE_MEET" | "ONLINE_MEET", caseId: string, body: string) {
  return apiRequestAuth<{ id: string; body: string; createdAt: string }>(API_ENDPOINTS.ops.addCaseNote(caseType, caseId), {
    method: "POST",
    body: JSON.stringify({ body })
  });
}
