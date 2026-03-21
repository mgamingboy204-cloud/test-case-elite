"use client";

import type { OfflineMeetStatusView } from "@/lib/offlineMeet";
import type { OnlineMeetStatusView } from "@/lib/onlineMeet";
import type { VerificationQueueView } from "@/lib/workerVerification";

export type OpsCaseType = "VERIFICATION" | "OFFLINE_MEET" | "ONLINE_MEET";

export const verificationQueueViews: VerificationQueueView[] = [
  "ACTIVE",
  "ESCALATED",
  "COMPLETED",
  "REJECTED",
  "ALL"
];

export const offlineMeetQueueViews: OfflineMeetStatusView[] = [
  "ACTIVE",
  "FINALIZED",
  "CONFLICT",
  "TIMEOUT",
  "CANCELED",
  "ALL"
];

export const onlineMeetQueueViews: OnlineMeetStatusView[] = [
  "ACTIVE",
  "FINALIZED",
  "CONFLICT",
  "TIMEOUT",
  "CANCELED",
  "ALL"
];

export const queryKeys = {
  member: {
    all: () => ["member"] as const,
    discoverFeed: () => ["member", "discover-feed"] as const,
    likes: {
      all: () => ["member", "likes"] as const,
      list: () => ["member", "likes", "list"] as const
    },
    matches: {
      all: () => ["member", "matches"] as const,
      list: () => ["member", "matches", "list"] as const
    },
    alerts: {
      all: () => ["member", "alerts"] as const,
      list: () => ["member", "alerts", "list"] as const
    },
    profile: {
      all: () => ["member", "profile"] as const,
      detail: () => ["member", "profile", "detail"] as const
    },
    verification: {
      all: () => ["member", "verification"] as const,
      status: () => ["member", "verification", "status"] as const
    },
    offlineMeet: {
      all: () => ["member", "offline-meet"] as const,
      case: (matchId: string) => ["member", "offline-meet", "case", matchId] as const
    },
    onlineMeet: {
      all: () => ["member", "online-meet"] as const,
      case: (matchId: string) => ["member", "online-meet", "case", matchId] as const
    }
  },
  ops: {
    all: () => ["ops"] as const,
    verification: {
      all: () => ["ops", "verification"] as const,
      queues: () => ["ops", "verification", "queue"] as const,
      queue: (view: VerificationQueueView) => ["ops", "verification", "queue", view] as const,
      detail: (requestId: string) => ["ops", "verification", "detail", requestId] as const
    },
    offlineMeet: {
      all: () => ["ops", "offline-meet"] as const,
      queues: () => ["ops", "offline-meet", "queue"] as const,
      queue: (view: OfflineMeetStatusView) => ["ops", "offline-meet", "queue", view] as const,
      detail: (caseId: string) => ["ops", "offline-meet", "detail", caseId] as const
    },
    onlineMeet: {
      all: () => ["ops", "online-meet"] as const,
      queues: () => ["ops", "online-meet", "queue"] as const,
      queue: (view: OnlineMeetStatusView) => ["ops", "online-meet", "queue", view] as const,
      detail: (caseId: string) => ["ops", "online-meet", "detail", caseId] as const
    },
    caseActivity: {
      all: () => ["ops", "case-activity"] as const,
      detail: (caseType: OpsCaseType, caseId: string) => ["ops", "case-activity", caseType, caseId] as const
    },
    employee: {
      all: () => ["ops", "employee"] as const,
      dashboard: () => ["ops", "employee", "dashboard"] as const,
      assignedCases: () => ["ops", "employee", "assigned-cases"] as const,
      escalations: () => ["ops", "employee", "escalations"] as const
    },
    admin: {
      all: () => ["ops", "admin"] as const,
      dashboard: () => ["ops", "admin", "dashboard"] as const,
      members: () => ["ops", "admin", "members"] as const,
      escalations: () => ["ops", "admin", "escalations"] as const,
      auditLogs: {
        all: () => ["ops", "admin", "audit-logs"] as const,
        list: (limit = 100) => ["ops", "admin", "audit-logs", limit] as const
      },
      staff: () => ["ops", "admin", "staff"] as const
    }
  }
} as const;
