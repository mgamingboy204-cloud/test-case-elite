"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useLiveResourceRefresh } from "@/contexts/LiveUpdatesContext";
import {
  ADMIN_AUDIT_FALLBACK_MS,
  ADMIN_DASHBOARD_FALLBACK_MS,
  ADMIN_STAFF_FALLBACK_MS,
  EMPLOYEE_COORDINATION_FALLBACK_MS,
  EMPLOYEE_QUEUE_FALLBACK_MS,
  EMPLOYEE_SUMMARY_FALLBACK_MS,
  VERIFICATION_STATUS_FALLBACK_MS
} from "@/lib/resourceSync";

type LiveQueryResourceName =
  | "member.likes"
  | "member.matches"
  | "member.alerts"
  | "member.profile"
  | "member.verificationStatus"
  | "member.offlineMeetCase"
  | "member.onlineMeetCase"
  | "ops.verificationQueue"
  | "ops.offlineMeetQueue"
  | "ops.onlineMeetQueue"
  | "ops.caseActivity"
  | "ops.employeeDashboard"
  | "ops.employeeAssignedCases"
  | "ops.employeeEscalations"
  | "ops.adminDashboard"
  | "ops.adminMembers"
  | "ops.adminEscalations"
  | "ops.adminAuditLogs"
  | "ops.adminStaff";

const liveQueryResourceConfig: Record<
  LiveQueryResourceName,
  {
    eventTypes?: Array<
      | "alerts.changed"
      | "likes.changed"
      | "matches.changed"
      | "profile.changed"
      | "verification.status.changed"
      | "admin.verification.queue.changed"
      | "admin.offline_meets.changed"
      | "admin.online_meets.changed"
      | "admin.dashboard.changed"
      | "admin.staff.changed"
      | "admin.audit_logs.changed"
      | "ops.case_activity.changed"
    >;
    fallbackIntervalMs?: number;
  }
> = {
  "member.likes": {
    eventTypes: ["likes.changed"],
    fallbackIntervalMs: 10_000
  },
  "member.matches": {
    eventTypes: ["matches.changed"],
    fallbackIntervalMs: 5_000
  },
  "member.alerts": {
    eventTypes: ["alerts.changed"],
    fallbackIntervalMs: 5_000
  },
  "member.profile": {
    eventTypes: ["profile.changed"],
    fallbackIntervalMs: 15_000
  },
  "member.verificationStatus": {
    eventTypes: ["verification.status.changed"],
    fallbackIntervalMs: VERIFICATION_STATUS_FALLBACK_MS
  },
  "member.offlineMeetCase": {
    eventTypes: ["matches.changed"],
    fallbackIntervalMs: 5_000
  },
  "member.onlineMeetCase": {
    eventTypes: ["matches.changed"],
    fallbackIntervalMs: 5_000
  },
  "ops.verificationQueue": {
    eventTypes: ["admin.verification.queue.changed"],
    fallbackIntervalMs: EMPLOYEE_QUEUE_FALLBACK_MS
  },
  "ops.offlineMeetQueue": {
    eventTypes: ["admin.offline_meets.changed"],
    fallbackIntervalMs: EMPLOYEE_COORDINATION_FALLBACK_MS
  },
  "ops.onlineMeetQueue": {
    eventTypes: ["admin.online_meets.changed"],
    fallbackIntervalMs: EMPLOYEE_COORDINATION_FALLBACK_MS
  },
  "ops.caseActivity": {
    eventTypes: ["ops.case_activity.changed"],
    fallbackIntervalMs: EMPLOYEE_SUMMARY_FALLBACK_MS
  },
  "ops.employeeDashboard": {
    eventTypes: ["admin.verification.queue.changed", "admin.offline_meets.changed", "admin.online_meets.changed"],
    fallbackIntervalMs: EMPLOYEE_SUMMARY_FALLBACK_MS
  },
  "ops.employeeAssignedCases": {
    eventTypes: ["admin.verification.queue.changed", "admin.offline_meets.changed", "admin.online_meets.changed"],
    fallbackIntervalMs: EMPLOYEE_SUMMARY_FALLBACK_MS
  },
  "ops.employeeEscalations": {
    eventTypes: ["admin.verification.queue.changed"],
    fallbackIntervalMs: EMPLOYEE_SUMMARY_FALLBACK_MS
  },
  "ops.adminDashboard": {
    eventTypes: ["admin.dashboard.changed"],
    fallbackIntervalMs: ADMIN_DASHBOARD_FALLBACK_MS
  },
  "ops.adminMembers": {
    eventTypes: ["admin.dashboard.changed", "admin.verification.queue.changed"],
    fallbackIntervalMs: ADMIN_DASHBOARD_FALLBACK_MS
  },
  "ops.adminEscalations": {
    eventTypes: ["admin.verification.queue.changed", "admin.dashboard.changed"],
    fallbackIntervalMs: EMPLOYEE_SUMMARY_FALLBACK_MS
  },
  "ops.adminAuditLogs": {
    eventTypes: ["admin.audit_logs.changed"],
    fallbackIntervalMs: ADMIN_AUDIT_FALLBACK_MS
  },
  "ops.adminStaff": {
    eventTypes: ["admin.staff.changed"],
    fallbackIntervalMs: ADMIN_STAFF_FALLBACK_MS
  }
};

export function useLiveQueryResourceSync(options: {
  enabled: boolean;
  resource: LiveQueryResourceName;
  queryKey: QueryKey;
  exact?: boolean;
  refreshOnForeground?: boolean;
}) {
  const queryClient = useQueryClient();
  const config = liveQueryResourceConfig[options.resource];

  useLiveResourceRefresh({
    enabled: options.enabled,
    eventTypes: config.eventTypes,
    fallbackIntervalMs: config.fallbackIntervalMs,
    refreshOnForeground: options.refreshOnForeground,
    refresh: () =>
      queryClient.invalidateQueries({
        queryKey: options.queryKey,
        exact: options.exact ?? true,
        refetchType: "active"
      })
  });
}
