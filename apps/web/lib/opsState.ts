"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient
} from "@tanstack/react-query";
import { fetchAdminDashboard, type AdminDashboardPayload } from "@/lib/adminDashboard";
import { invalidateQueryKeys, syncItemInList, upsertById } from "@/lib/queryDataUtils";
import { useLiveQueryResourceSync } from "@/lib/liveQueryResources";
import {
  offlineMeetQueueViews,
  onlineMeetQueueViews,
  queryKeys,
  verificationQueueViews,
  type OpsCaseType
} from "@/lib/queryKeys";
import {
  addCaseNote,
  createStaffMember,
  deactivateStaffMember,
  fetchAdminAuditLogs,
  fetchAdminEscalations,
  fetchAdminUsers,
  fetchAssignedCases,
  fetchCaseActivity,
  fetchEmployeeDashboard,
  fetchEmployeeEscalations,
  fetchStaffMembers,
  reactivateStaffMember,
  type AdminMember,
  type AssignedCase,
  type CaseActivityEntry,
  type OpsEscalation,
  type StaffMember
} from "@/lib/internalOps";
import {
  assignOfflineMeetCase,
  finalizeOfflineMeet,
  listOfflineMeetCasesForEmployee,
  markOfflineMeetNoOverlap,
  markOfflineMeetTimeout,
  sendOfflineMeetOptions,
  updateOfflineMeetCase,
  type OfflineMeetEmployeeCase,
  type OfflineMeetStatusView
} from "@/lib/offlineMeet";
import {
  assignOnlineMeetCase,
  finalizeOnlineMeet,
  listOnlineMeetCasesForEmployee,
  markOnlineMeetNoOverlap,
  markOnlineMeetTimeout,
  sendOnlineMeetOptions,
  updateOnlineMeetCase,
  type MeetPlatform,
  type OnlineMeetEmployeeCase,
  type OnlineMeetStatusView
} from "@/lib/onlineMeet";
import {
  approveVerificationRequest,
  assignVerificationRequest,
  listVerificationRequestsForWorker,
  rejectVerificationRequest,
  startVerificationRequest,
  type VerificationQueueView,
  type WorkerVerificationRequest
} from "@/lib/workerVerification";

const verificationActiveStatuses = new Set(["PENDING", "ESCALATED", "ASSIGNED", "IN_PROGRESS"]);
const offlineActiveStatuses = new Set([
  "REQUESTED",
  "ACCEPTED",
  "EMPLOYEE_PREPARING_OPTIONS",
  "OPTIONS_SENT",
  "AWAITING_USER_SELECTIONS",
  "USER_ONE_RESPONDED",
  "USER_TWO_RESPONDED",
  "READY_FOR_FINALIZATION",
  "RESCHEDULE_REQUESTED"
]);
const onlineActiveStatuses = new Set([
  "REQUESTED",
  "ACCEPTED",
  "EMPLOYEE_PREPARING_OPTIONS",
  "OPTIONS_SENT",
  "AWAITING_USER_SELECTIONS",
  "USER_ONE_RESPONDED",
  "USER_TWO_RESPONDED",
  "READY_FOR_FINALIZATION",
  "RESCHEDULE_REQUESTED"
]);

function toTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortVerificationRequests(left: WorkerVerificationRequest, right: WorkerVerificationRequest) {
  const priority = (request: WorkerVerificationRequest) => {
    if (request.status === "ESCALATED") return 0;
    if (request.status === "PENDING") return 1;
    if (request.status === "ASSIGNED") return 2;
    if (request.status === "IN_PROGRESS") return 3;
    if (request.status === "COMPLETED") return 4;
    return 5;
  };

  const priorityDelta = priority(left) - priority(right);
  if (priorityDelta !== 0) return priorityDelta;

  if (left.status === "ESCALATED" || left.status === "PENDING") {
    return toTimestamp(left.createdAt) - toTimestamp(right.createdAt);
  }

  return toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt);
}

function sortOfflineMeetCases(left: OfflineMeetEmployeeCase, right: OfflineMeetEmployeeCase) {
  return toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt);
}

function sortOnlineMeetCases(left: OnlineMeetEmployeeCase, right: OnlineMeetEmployeeCase) {
  return toTimestamp(right.updatedAt) - toTimestamp(left.updatedAt);
}

function sortCaseActivityEntries(left: CaseActivityEntry, right: CaseActivityEntry) {
  return toTimestamp(left.createdAt) - toTimestamp(right.createdAt);
}

function sortStaffMembers(left: StaffMember, right: StaffMember) {
  const roleDelta = left.role.localeCompare(right.role);
  if (roleDelta !== 0) return roleDelta;
  return toTimestamp(right.createdAt) - toTimestamp(left.createdAt);
}

function isVerificationVisibleInView(request: WorkerVerificationRequest, view: VerificationQueueView) {
  if (view === "ALL") return true;
  if (view === "ACTIVE") return verificationActiveStatuses.has(request.status);
  return request.status === view;
}

function isOfflineMeetVisibleInView(caseItem: OfflineMeetEmployeeCase, view: OfflineMeetStatusView) {
  if (view === "ALL") return true;
  if (view === "ACTIVE") return offlineActiveStatuses.has(caseItem.status);
  if (view === "FINALIZED") return caseItem.status === "FINALIZED";
  if (view === "CONFLICT") return caseItem.status === "NO_COMPATIBLE_OVERLAP" || caseItem.status === "RESCHEDULE_REQUESTED";
  if (view === "TIMEOUT") return caseItem.status === "NO_RESPONSE_TIMEOUT" || caseItem.status === "COOLDOWN";
  return caseItem.status === "CANCELED";
}

function isOnlineMeetVisibleInView(caseItem: OnlineMeetEmployeeCase, view: OnlineMeetStatusView) {
  if (view === "ALL") return true;
  if (view === "ACTIVE") return onlineActiveStatuses.has(caseItem.status);
  if (view === "FINALIZED") return caseItem.status === "FINALIZED";
  if (view === "CONFLICT") return caseItem.status === "NO_COMPATIBLE_OVERLAP" || caseItem.status === "RESCHEDULE_REQUESTED";
  if (view === "TIMEOUT") return caseItem.status === "NO_RESPONSE_TIMEOUT" || caseItem.status === "COOLDOWN";
  return caseItem.status === "CANCELED";
}

function syncVerificationRequestCaches(queryClient: ReturnType<typeof useQueryClient>, request: WorkerVerificationRequest) {
  queryClient.setQueryData(queryKeys.ops.verification.detail(request.id), request);

  for (const view of verificationQueueViews) {
    queryClient.setQueryData<WorkerVerificationRequest[]>(
      queryKeys.ops.verification.queue(view),
      (current) =>
        syncItemInList(current, request, isVerificationVisibleInView(request, view), {
          sort: sortVerificationRequests
        })
    );
  }
}

function syncOfflineMeetCaseCaches(queryClient: ReturnType<typeof useQueryClient>, caseItem: OfflineMeetEmployeeCase) {
  queryClient.setQueryData(queryKeys.ops.offlineMeet.detail(caseItem.id), caseItem);

  for (const view of offlineMeetQueueViews) {
    queryClient.setQueryData<OfflineMeetEmployeeCase[]>(
      queryKeys.ops.offlineMeet.queue(view),
      (current) =>
        syncItemInList(current, caseItem, isOfflineMeetVisibleInView(caseItem, view), {
          sort: sortOfflineMeetCases
        })
    );
  }
}

function syncOnlineMeetCaseCaches(queryClient: ReturnType<typeof useQueryClient>, caseItem: OnlineMeetEmployeeCase) {
  queryClient.setQueryData(queryKeys.ops.onlineMeet.detail(caseItem.id), caseItem);

  for (const view of onlineMeetQueueViews) {
    queryClient.setQueryData<OnlineMeetEmployeeCase[]>(
      queryKeys.ops.onlineMeet.queue(view),
      (current) =>
        syncItemInList(current, caseItem, isOnlineMeetVisibleInView(caseItem, view), {
          sort: sortOnlineMeetCases
        })
    );
  }
}

function syncStaffMemberCaches(queryClient: ReturnType<typeof useQueryClient>, staff: StaffMember) {
  queryClient.setQueryData<StaffMember[]>(queryKeys.ops.admin.staff(), (current) =>
    upsertById(current, staff, { sort: sortStaffMembers })
  );
}

function syncCaseActivityEntry(
  queryClient: ReturnType<typeof useQueryClient>,
  caseType: OpsCaseType,
  caseId: string,
  entry: CaseActivityEntry
) {
  queryClient.setQueryData<CaseActivityEntry[]>(
    queryKeys.ops.caseActivity.detail(caseType, caseId),
    (current) => upsertById(current, entry, { sort: sortCaseActivityEntries })
  );
}

export function getVerificationOwnershipLabel(request: WorkerVerificationRequest, actorUserId: string | null) {
  if (!request.assignedEmployeeId) return "Unassigned";
  if (request.assignedEmployeeId === actorUserId) return "Assigned to you";
  return "Assigned to another executive";
}

export function canAssignVerificationRequest(request: WorkerVerificationRequest | null, isBusy: boolean) {
  return Boolean(request && ["PENDING", "ESCALATED"].includes(request.status) && !request.assignedEmployeeId && !isBusy);
}

export function canStartVerificationRequest(
  request: WorkerVerificationRequest | null,
  actorUserId: string | null,
  isBusy: boolean
) {
  return Boolean(
    request &&
      actorUserId &&
      request.assignedEmployeeId === actorUserId &&
      ["ASSIGNED", "IN_PROGRESS"].includes(request.status) &&
      !isBusy
  );
}

export function canResolveVerificationRequest(
  request: WorkerVerificationRequest | null,
  actorUserId: string | null,
  isBusy: boolean
) {
  return canStartVerificationRequest(request, actorUserId, isBusy);
}

export function isCoordinationCaseActionable(
  caseItem: OfflineMeetEmployeeCase | OnlineMeetEmployeeCase | null,
  actorUserId: string | null
) {
  if (!caseItem) return false;
  const activeStatuses = "finalMeetingLink" in caseItem ? onlineActiveStatuses : offlineActiveStatuses;
  if (!activeStatuses.has(caseItem.status)) return false;
  return !caseItem.assignedEmployeeId || caseItem.assignedEmployeeId === actorUserId;
}

export function useVerificationQueue(view: VerificationQueueView, enabled = true) {
  const queryKey = queryKeys.ops.verification.queue(view);
  const query = useQuery({
    queryKey,
    queryFn: async () => (await listVerificationRequestsForWorker(view)).requests,
    enabled,
    placeholderData: keepPreviousData
  });

  useLiveQueryResourceSync({
    enabled,
    resource: "ops.verificationQueue",
    queryKey
  });

  return query;
}

export function useOfflineMeetQueue(view: OfflineMeetStatusView, enabled = true) {
  const queryKey = queryKeys.ops.offlineMeet.queue(view);
  const query = useQuery({
    queryKey,
    queryFn: async () => (await listOfflineMeetCasesForEmployee(view)).cases,
    enabled,
    placeholderData: keepPreviousData
  });

  useLiveQueryResourceSync({
    enabled,
    resource: "ops.offlineMeetQueue",
    queryKey
  });

  return query;
}

export function useOnlineMeetQueue(view: OnlineMeetStatusView, enabled = true) {
  const queryKey = queryKeys.ops.onlineMeet.queue(view);
  const query = useQuery({
    queryKey,
    queryFn: async () => (await listOnlineMeetCasesForEmployee(view)).cases,
    enabled,
    placeholderData: keepPreviousData
  });

  useLiveQueryResourceSync({
    enabled,
    resource: "ops.onlineMeetQueue",
    queryKey
  });

  return query;
}

export function useEmployeeDashboardData(enabled = true) {
  const queryKey = queryKeys.ops.employee.dashboard();
  const query = useQuery({
    queryKey,
    queryFn: fetchEmployeeDashboard,
    enabled
  });

  useLiveQueryResourceSync({
    enabled,
    resource: "ops.employeeDashboard",
    queryKey
  });

  return query;
}

export function useAssignedCasesData(enabled = true) {
  const queryKey = queryKeys.ops.employee.assignedCases();
  const query = useQuery({
    queryKey,
    queryFn: async () => (await fetchAssignedCases()).cases,
    enabled
  });

  useLiveQueryResourceSync({
    enabled,
    resource: "ops.employeeAssignedCases",
    queryKey
  });

  return query;
}

export function useEmployeeEscalationsData(enabled = true) {
  const queryKey = queryKeys.ops.employee.escalations();
  const query = useQuery({
    queryKey,
    queryFn: async () => (await fetchEmployeeEscalations()).escalations,
    enabled
  });

  useLiveQueryResourceSync({
    enabled,
    resource: "ops.employeeEscalations",
    queryKey
  });

  return query;
}

export function useAdminDashboardData(enabled = true) {
  const queryKey = queryKeys.ops.admin.dashboard();
  const query = useQuery({
    queryKey,
    queryFn: fetchAdminDashboard,
    enabled
  });

  useLiveQueryResourceSync({
    enabled,
    resource: "ops.adminDashboard",
    queryKey
  });

  return query;
}

export function useAdminMembersData(enabled = true) {
  const queryKey = queryKeys.ops.admin.members();
  const query = useQuery({
    queryKey,
    queryFn: async () => (await fetchAdminUsers()).users.filter((user) => user.role === "USER"),
    enabled
  });

  useLiveQueryResourceSync({
    enabled,
    resource: "ops.adminMembers",
    queryKey
  });

  return query;
}

export function useAdminEscalationsData(enabled = true) {
  const queryKey = queryKeys.ops.admin.escalations();
  const query = useQuery({
    queryKey,
    queryFn: fetchAdminEscalations,
    enabled
  });

  useLiveQueryResourceSync({
    enabled,
    resource: "ops.adminEscalations",
    queryKey
  });

  return query;
}

export function useAdminAuditLogsData(limit = 100, enabled = true) {
  const queryKey = queryKeys.ops.admin.auditLogs.list(limit);
  const query = useQuery({
    queryKey,
    queryFn: async () => (await fetchAdminAuditLogs(limit)).logs,
    enabled
  });

  useLiveQueryResourceSync({
    enabled,
    resource: "ops.adminAuditLogs",
    queryKey,
    exact: false
  });

  return query;
}

export function useStaffMembersData(enabled = true) {
  const queryKey = queryKeys.ops.admin.staff();
  const query = useQuery({
    queryKey,
    queryFn: async () => (await fetchStaffMembers()).staff,
    enabled
  });

  useLiveQueryResourceSync({
    enabled,
    resource: "ops.adminStaff",
    queryKey
  });

  return query;
}

export function useCaseActivityData(caseType: OpsCaseType, caseId: string | null, enabled = true) {
  const queryKey = queryKeys.ops.caseActivity.detail(caseType, caseId ?? "__none__");
  const query = useQuery({
    queryKey,
    queryFn: async () => (await fetchCaseActivity(caseType, caseId ?? "")).entries,
    enabled: enabled && Boolean(caseId)
  });

  useLiveQueryResourceSync({
    enabled: enabled && Boolean(caseId),
    resource: "ops.caseActivity",
    queryKey
  });

  return query;
}

function getVerificationInvalidationKeys(requestId: string) {
  return [
    queryKeys.ops.verification.all(),
    queryKeys.ops.employee.all(),
    queryKeys.ops.admin.dashboard(),
    queryKeys.ops.admin.members(),
    queryKeys.ops.admin.escalations(),
    queryKeys.ops.admin.auditLogs.all(),
    queryKeys.ops.caseActivity.detail("VERIFICATION", requestId)
  ];
}

function getOfflineMeetInvalidationKeys(caseId: string) {
  return [
    queryKeys.ops.employee.all(),
    queryKeys.ops.admin.dashboard(),
    queryKeys.ops.admin.auditLogs.all(),
    queryKeys.ops.caseActivity.detail("OFFLINE_MEET", caseId),
    queryKeys.member.matches.all(),
    queryKeys.member.alerts.all()
  ];
}

function getOnlineMeetInvalidationKeys(caseId: string) {
  return [
    queryKeys.ops.employee.all(),
    queryKeys.ops.admin.dashboard(),
    queryKeys.ops.admin.auditLogs.all(),
    queryKeys.ops.caseActivity.detail("ONLINE_MEET", caseId),
    queryKeys.member.matches.all(),
    queryKeys.member.alerts.all()
  ];
}

export function useAssignVerificationRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignVerificationRequest,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.ops.verification.all(),
        exact: false
      });
    },
    onSuccess: async (result) => {
      syncVerificationRequestCaches(queryClient, result.request);
      await invalidateQueryKeys(queryClient, getVerificationInvalidationKeys(result.request.id));
    }
  });
}

export function useStartVerificationRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, meetUrl }: { requestId: string; meetUrl: string }) =>
      startVerificationRequest(requestId, meetUrl),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.ops.verification.all(),
        exact: false
      });
    },
    onSuccess: async (result) => {
      syncVerificationRequestCaches(queryClient, result.request);
      await invalidateQueryKeys(queryClient, getVerificationInvalidationKeys(result.request.id));
    }
  });
}

export function useApproveVerificationRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveVerificationRequest,
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.ops.verification.all(),
        exact: false
      });
    },
    onSuccess: async (result) => {
      syncVerificationRequestCaches(queryClient, result.request);
      await invalidateQueryKeys(queryClient, getVerificationInvalidationKeys(result.request.id));
    }
  });
}

export function useRejectVerificationRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      rejectVerificationRequest(requestId, reason),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.ops.verification.all(),
        exact: false
      });
    },
    onSuccess: async (result) => {
      syncVerificationRequestCaches(queryClient, result.request);
      await invalidateQueryKeys(queryClient, getVerificationInvalidationKeys(result.request.id));
    }
  });
}

export function useAssignOfflineMeetCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignOfflineMeetCase,
    onSuccess: async (result) => {
      syncOfflineMeetCaseCaches(queryClient, result.case);
      await invalidateQueryKeys(queryClient, getOfflineMeetInvalidationKeys(result.case.id));
    }
  });
}

export function useSendOfflineMeetOptionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      cafes,
      timeSlots
    }: {
      caseId: string;
      cafes: Array<{ id: string; name: string; address: string }>;
      timeSlots: Array<{ id: string; label: string; startsAtIso?: string | null }>;
    }) => sendOfflineMeetOptions(caseId, { cafes, timeSlots }),
    onSuccess: async (result) => {
      syncOfflineMeetCaseCaches(queryClient, result.case);
      await invalidateQueryKeys(queryClient, getOfflineMeetInvalidationKeys(result.case.id));
    }
  });
}

export function useFinalizeOfflineMeetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, finalCafeId, finalTimeSlotId }: { caseId: string; finalCafeId: string; finalTimeSlotId: string }) =>
      finalizeOfflineMeet(caseId, finalCafeId, finalTimeSlotId),
    onSuccess: async (result) => {
      syncOfflineMeetCaseCaches(queryClient, result.case);
      await invalidateQueryKeys(queryClient, getOfflineMeetInvalidationKeys(result.case.id));
    }
  });
}

export function useMarkOfflineMeetTimeoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, nonResponderUserId }: { caseId: string; nonResponderUserId: string }) =>
      markOfflineMeetTimeout(caseId, nonResponderUserId),
    onSuccess: async (result) => {
      syncOfflineMeetCaseCaches(queryClient, result.case);
      await invalidateQueryKeys(queryClient, getOfflineMeetInvalidationKeys(result.case.id));
    }
  });
}

export function useMarkOfflineMeetNoOverlapMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markOfflineMeetNoOverlap,
    onSuccess: async (result) => {
      syncOfflineMeetCaseCaches(queryClient, result.case);
      await invalidateQueryKeys(queryClient, getOfflineMeetInvalidationKeys(result.case.id));
    }
  });
}

export function useUpdateOfflineMeetCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      action,
      reason,
      requestedByUserId
    }: {
      caseId: string;
      action: "CANCEL" | "RESCHEDULE";
      reason: string;
      requestedByUserId?: string | null;
    }) => updateOfflineMeetCase(caseId, { action, reason, requestedByUserId }),
    onSuccess: async (result) => {
      syncOfflineMeetCaseCaches(queryClient, result.case);
      await invalidateQueryKeys(queryClient, getOfflineMeetInvalidationKeys(result.case.id));
    }
  });
}

export function useAssignOnlineMeetCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignOnlineMeetCase,
    onSuccess: async (result) => {
      syncOnlineMeetCaseCaches(queryClient, result.case);
      await invalidateQueryKeys(queryClient, getOnlineMeetInvalidationKeys(result.case.id));
    }
  });
}

export function useSendOnlineMeetOptionsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      platforms,
      timeSlots
    }: {
      caseId: string;
      platforms: MeetPlatform[];
      timeSlots: Array<{ id: string; label: string; startsAtIso?: string | null }>;
    }) => sendOnlineMeetOptions(caseId, { platforms, timeSlots }),
    onSuccess: async (result) => {
      syncOnlineMeetCaseCaches(queryClient, result.case);
      await invalidateQueryKeys(queryClient, getOnlineMeetInvalidationKeys(result.case.id));
    }
  });
}

export function useFinalizeOnlineMeetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      finalPlatform,
      finalTimeSlotId,
      finalMeetingLink
    }: {
      caseId: string;
      finalPlatform: MeetPlatform;
      finalTimeSlotId: string;
      finalMeetingLink: string;
    }) =>
      finalizeOnlineMeet(caseId, {
        finalPlatform,
        finalTimeSlotId,
        finalMeetingLink
      }),
    onSuccess: async (result) => {
      syncOnlineMeetCaseCaches(queryClient, result.case);
      await invalidateQueryKeys(queryClient, getOnlineMeetInvalidationKeys(result.case.id));
    }
  });
}

export function useMarkOnlineMeetTimeoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, nonResponderUserId }: { caseId: string; nonResponderUserId: string }) =>
      markOnlineMeetTimeout(caseId, nonResponderUserId),
    onSuccess: async (result) => {
      syncOnlineMeetCaseCaches(queryClient, result.case);
      await invalidateQueryKeys(queryClient, getOnlineMeetInvalidationKeys(result.case.id));
    }
  });
}

export function useMarkOnlineMeetNoOverlapMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markOnlineMeetNoOverlap,
    onSuccess: async (result) => {
      syncOnlineMeetCaseCaches(queryClient, result.case);
      await invalidateQueryKeys(queryClient, getOnlineMeetInvalidationKeys(result.case.id));
    }
  });
}

export function useUpdateOnlineMeetCaseMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      caseId,
      action,
      reason,
      requestedByUserId
    }: {
      caseId: string;
      action: "CANCEL" | "RESCHEDULE";
      reason: string;
      requestedByUserId?: string | null;
    }) => updateOnlineMeetCase(caseId, { action, reason, requestedByUserId }),
    onSuccess: async (result) => {
      syncOnlineMeetCaseCaches(queryClient, result.case);
      await invalidateQueryKeys(queryClient, getOnlineMeetInvalidationKeys(result.case.id));
    }
  });
}

export function useCreateStaffMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStaffMember,
    onSuccess: async (result) => {
      syncStaffMemberCaches(queryClient, result.staff);
      await invalidateQueryKeys(queryClient, [
        queryKeys.ops.admin.dashboard(),
        queryKeys.ops.admin.auditLogs.all()
      ]);
    }
  });
}

export function useSetStaffActivationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ staffUserId, active }: { staffUserId: string; active: boolean }) =>
      active ? reactivateStaffMember(staffUserId) : deactivateStaffMember(staffUserId),
    onSuccess: async (result) => {
      syncStaffMemberCaches(queryClient, result.staff);
      await invalidateQueryKeys(queryClient, [
        queryKeys.ops.admin.dashboard(),
        queryKeys.ops.admin.auditLogs.all()
      ]);
    }
  });
}

export function useAddCaseNoteMutation(caseType: OpsCaseType, caseId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => {
      if (!caseId) throw new Error("Case id is required.");
      return addCaseNote(caseType, caseId, body);
    },
    onSuccess: async (result) => {
      if (!caseId) return;
      syncCaseActivityEntry(queryClient, caseType, caseId, result.entry);
      await invalidateQueryKeys(queryClient, [queryKeys.ops.admin.auditLogs.all()]);
    }
  });
}

export type {
  AdminDashboardPayload,
  AdminMember,
  AssignedCase,
  CaseActivityEntry,
  OpsEscalation,
  StaffMember
};
