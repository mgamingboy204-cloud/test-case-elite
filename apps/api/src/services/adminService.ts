import {
  NotificationType,
  OfflineMeetCoordinationStatus,
  OnlineMeetCoordinationStatus,
  PaymentPlan,
  PaymentStatus,
  PhoneExchangeCaseStatus,
  Prisma,
  SocialExchangeStatus,
  SubscriptionStatus,
  VerificationRequestStatus
} from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";
import { listEmployeeWorkloads } from "./employeeService";
import { synchronizeVerificationRequests } from "./verificationService";
import {
  emitAdminAuditLogsChanged,
  emitAdminDashboardChanged,
  emitAlertsChanged,
  emitOpsCaseActivityChanged,
  emitSessionStateChanged,
  emitVerificationQueueChanged,
  emitVerificationStatusChanged
} from "../live/liveEventBroker";

type VerificationRequestListItem = {
  id: string;
  status: VerificationRequestStatus;
  verificationLink: string | null;
  meetUrl: string | null;
  createdAt: Date;
  assignedAt: Date | null;
  assignedEmployeeId: string | null;
  reason: string | null;
  updatedAt: Date;
  escalationRequestedAt: string | null;
  user: {
    id: string;
    phone: string;
    email: string | null;
  };
};

const verificationRequestInclude = {
  user: { select: { id: true, phone: true, email: true } },
  escalationRequest: {
    select: {
      requestedAt: true,
      status: true
    }
  }
} satisfies Prisma.VerificationRequestInclude;

type VerificationRequestWithRelations = Prisma.VerificationRequestGetPayload<{
  include: typeof verificationRequestInclude;
}>;
type UserListItem = Prisma.UserGetPayload<{
  select: {
    id: true;
    phone: true;
    email: true;
    firstName: true;
    lastName: true;
    displayName: true;
    gender: true;
    role: true;
    isAdmin: true;
    status: true;
    onboardingStep: true;
    videoVerificationStatus: true;
    paymentStatus: true;
    profileCompletedAt: true;
    deactivatedAt: true;
    deletedAt: true;
    verifiedAt: true;
    createdAt: true;
    profile: { select: { name: true } };
  };
}>;
type ReportListItem = Prisma.ReportGetPayload<{
  include: { reporter: { select: { id: true; phone: true } }; reportedUser: { select: { id: true; phone: true } } };
}>;
type RefundListItem = Prisma.RefundRequestGetPayload<{
  include: { user: { select: { id: true; phone: true; email: true } } };
}>;

type VerificationWorkerView = "ACTIVE" | "ESCALATED" | "COMPLETED" | "REJECTED" | "ALL";
type VerificationAlertEventType = "VERIFICATION_ASSIGNED" | "VERIFICATION_APPROVED" | "VERIFICATION_REJECTED";

const ADMIN_NOTIFICATION_TYPES = [
  NotificationType.VIDEO_VERIFICATION_UPDATE,
  NotificationType.OFFLINE_MEET_REQUEST,
  NotificationType.OFFLINE_MEET_TIMEOUT,
  NotificationType.OFFLINE_MEET_NO_OVERLAP,
  NotificationType.ONLINE_MEET_REQUEST,
  NotificationType.ONLINE_MEET_TIMEOUT,
  NotificationType.ONLINE_MEET_NO_OVERLAP,
  NotificationType.SOCIAL_EXCHANGE_REQUEST,
  NotificationType.PHONE_EXCHANGE_REQUEST
] as const;

type AdminNotificationType = (typeof ADMIN_NOTIFICATION_TYPES)[number];

const ADMIN_NOTIFICATION_TYPE_SET: ReadonlySet<NotificationType> = new Set(ADMIN_NOTIFICATION_TYPES);

function isAdminNotificationType(type: NotificationType): type is AdminNotificationType {
  return ADMIN_NOTIFICATION_TYPE_SET.has(type);
}

const VERIFICATION_VIEW_STATUS_MAP: Record<Exclude<VerificationWorkerView, "ALL">, VerificationRequestStatus[]> = {
  ACTIVE: ["PENDING", "ESCALATED", "ASSIGNED", "IN_PROGRESS"],
  ESCALATED: ["ESCALATED"],
  COMPLETED: ["COMPLETED"],
  REJECTED: ["REJECTED"]
};

function resolveVerificationWorkerView(value?: string): VerificationWorkerView {
  if (!value) return "ACTIVE";
  const normalized = value.trim().toUpperCase();
  if (normalized === "ALL") return "ALL";
  if (normalized in VERIFICATION_VIEW_STATUS_MAP) {
    return normalized as keyof typeof VERIFICATION_VIEW_STATUS_MAP;
  }
  throw new HttpError(400, { message: "Invalid verification status view." });
}

function mapVerificationRequestListItem(request: VerificationRequestWithRelations): VerificationRequestListItem {
  return {
    id: request.id,
    status: request.status,
    verificationLink: request.verificationLink,
    meetUrl: request.meetUrl,
    createdAt: request.createdAt,
    assignedAt: request.assignedAt,
    assignedEmployeeId: request.assignedEmployeeId,
    reason: request.reason,
    updatedAt: request.updatedAt,
    escalationRequestedAt:
      request.status === "ESCALATED" && request.escalationRequest
        ? request.escalationRequest.requestedAt.toISOString()
        : null,
    user: request.user
  };
}

function sortVerificationRequests(left: VerificationRequestListItem, right: VerificationRequestListItem) {
  const priority = (request: VerificationRequestListItem) => {
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
    return left.createdAt.getTime() - right.createdAt.getTime();
  }

  return right.updatedAt.getTime() - left.updatedAt.getTime();
}

async function getVerificationRequestListItemById(
  requestId: string,
  db: Prisma.TransactionClient | typeof prisma = prisma
) {
  const request = await db.verificationRequest.findUnique({
    where: { id: requestId },
    include: verificationRequestInclude
  });
  return request ? mapVerificationRequestListItem(request) : null;
}

export async function approveUser(userId: string, actorUserId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "APPROVED" }
  });
  await prisma.auditLog.create({
    data: { actorUserId, action: "approve", targetType: "User", targetId: user.id, metadata: {} }
  });
  emitAdminDashboardChanged();
  return { id: user.id, status: user.status };
}

export async function rejectUser(userId: string, actorUserId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "REJECTED" }
  });
  await prisma.auditLog.create({
    data: { actorUserId, action: "reject", targetType: "User", targetId: user.id, metadata: {} }
  });
  emitAdminDashboardChanged();
  return { id: user.id, status: user.status };
}

export async function banUser(userId: string, actorUserId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "BANNED" }
  });
  await prisma.auditLog.create({
    data: { actorUserId, action: "ban", targetType: "User", targetId: user.id, metadata: {} }
  });
  emitAdminDashboardChanged();
  return { id: user.id, status: user.status };
}

export async function listUsers(status?: string): Promise<{ users: UserListItem[] }> {
  const users: UserListItem[] = await prisma.user.findMany({
    where: status ? { status: status as any } : {},
    select: {
      id: true,
      phone: true,
      email: true,
      firstName: true,
      lastName: true,
      displayName: true,
      gender: true,
      role: true,
      isAdmin: true,
      status: true,
      onboardingStep: true,
      videoVerificationStatus: true,
      paymentStatus: true,
      profileCompletedAt: true,
      deactivatedAt: true,
      deletedAt: true,
      verifiedAt: true,
      createdAt: true,
      profile: { select: { name: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return { users };
}

export async function getDashboard() {
  const activeSubscriptionStatuses: SubscriptionStatus[] = ["ACTIVE"];
  const pendingVerificationStatuses: VerificationRequestStatus[] = ["PENDING", "ESCALATED", "ASSIGNED", "IN_PROGRESS"];
  const pendingOfflineStatuses: OfflineMeetCoordinationStatus[] = [
    "REQUESTED",
    "ACCEPTED",
    "EMPLOYEE_PREPARING_OPTIONS",
    "READY_FOR_FINALIZATION",
    "RESCHEDULE_REQUESTED"
  ];
  const pendingOnlineStatuses: OnlineMeetCoordinationStatus[] = [
    "REQUESTED",
    "ACCEPTED",
    "EMPLOYEE_PREPARING_OPTIONS",
    "READY_FOR_FINALIZATION",
    "RESCHEDULE_REQUESTED"
  ];
  const activeSocialExchangeStatuses: SocialExchangeStatus[] = [
    "REQUESTED",
    "ACCEPTED",
    "AWAITING_HANDLE_SUBMISSION",
    "HANDLE_SUBMITTED",
    "READY_TO_REVEAL"
  ];
  const activePhoneExchangeStatuses: PhoneExchangeCaseStatus[] = ["REQUESTED", "ACCEPTED", "MUTUAL_CONSENT_CONFIRMED"];
  const paymentIssueStatuses: PaymentStatus[] = ["FAILED", "CANCELED"];
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    verifiedUsers,
    bannedUsers,
    rejectedUsers,
    onboardingCompleted,
    activeSubscriptions,
    likesCount,
    matchesCount,
    offlineMeetCaseCount,
    onlineMeetCaseCount,
    socialExchangeCaseCount,
    phoneExchangeCaseCount,
    verificationQueue,
    pendingOfflineCoordination,
    pendingOnlineCoordination,
    paymentIssueCount,
    activeSocialExchangeRequests,
    activePhoneExchangeRequests,
    employees,
    notificationsInPastWeek,
    unreadOperationalAlerts
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null, status: "APPROVED", videoVerificationStatus: "APPROVED" } }),
    prisma.user.count({ where: { deletedAt: null, status: "BANNED" } }),
    prisma.user.count({ where: { deletedAt: null, status: "REJECTED" } }),
    prisma.user.count({ where: { deletedAt: null, onboardingStep: "ACTIVE" } }),
    prisma.user.count({ where: { deletedAt: null, subscriptionStatus: { in: activeSubscriptionStatuses } } }),
    prisma.like.count({ where: { action: "LIKE" } }),
    prisma.match.count({ where: { unmatchedAt: null } }),
    prisma.offlineMeetCase.count(),
    prisma.onlineMeetCase.count(),
    prisma.socialExchangeCase.count(),
    prisma.phoneExchangeCase.count(),
    prisma.verificationRequest.count({ where: { status: { in: pendingVerificationStatuses } } }),
    prisma.offlineMeetCase.count({ where: { status: { in: pendingOfflineStatuses } } }),
    prisma.onlineMeetCase.count({ where: { status: { in: pendingOnlineStatuses } } }),
    prisma.payment.count({ where: { status: { in: paymentIssueStatuses } } }),
    prisma.socialExchangeCase.count({ where: { status: { in: activeSocialExchangeStatuses } } }),
    prisma.phoneExchangeCase.count({ where: { status: { in: activePhoneExchangeStatuses } } }),
    listEmployeeWorkloads(),
    prisma.notification.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    prisma.notification.count({
      where: {
        createdAt: { gte: oneWeekAgo },
        isRead: false,
        type: {
          in: [...ADMIN_NOTIFICATION_TYPES]
        }
      }
    })
  ]);

  const [subscriptionPlans, verificationAssigned, notificationsByType] = await Promise.all([
    prisma.user.groupBy({
      by: ["onboardingPaymentPlan"],
      where: {
        deletedAt: null,
        subscriptionStatus: { in: activeSubscriptionStatuses },
        onboardingPaymentPlan: { not: null }
      },
      _count: { _all: true }
    }),
    prisma.verificationRequest.groupBy({
      by: ["assignedEmployeeId"],
      where: {
        status: { in: pendingVerificationStatuses },
        assignedEmployeeId: { not: null }
      },
      _count: { _all: true }
    }),
    prisma.notification.groupBy({
      by: ["type"],
      where: { createdAt: { gte: oneWeekAgo } },
      _count: { _all: true }
    })
  ]);

  const planDistribution: Record<PaymentPlan, number> = {
    ONE_MONTH: 0,
    FIVE_MONTHS: 0,
    TWELVE_MONTHS: 0
  };
  for (const planCount of subscriptionPlans) {
    if (planCount.onboardingPaymentPlan) {
      planDistribution[planCount.onboardingPaymentPlan] = planCount._count._all;
    }
  }

  const verificationByEmployee = new Map(
    verificationAssigned
      .filter((item) => item.assignedEmployeeId)
      .map((item) => [item.assignedEmployeeId as string, item._count._all])
  );

  const perEmployeeWorkload = employees.map((employee) => {
    const verificationActive = verificationByEmployee.get(employee.id) ?? 0;
    return {
      id: employee.id,
      employeeId: employee.employeeId,
      name: employee.name,
      assignedMembers: employee.assignedMembers,
      verificationActive,
      activeOfflineCases: employee.activeOfflineCases,
      activeOnlineCases: employee.activeOnlineCases,
      totalActiveTasks: verificationActive + employee.activeOfflineCases + employee.activeOnlineCases
    };
  });

  const recentAlertBreakdown = notificationsByType
    .filter((entry) => isAdminNotificationType(entry.type))
    .map((entry) => ({ type: entry.type, count: entry._count._all }))
    .sort((a, b) => b.count - a.count);

  return {
    generatedAt: new Date().toISOString(),
    businessOverview: {
      totalUsers,
      activeSubscriptions,
      onboardingCompleted,
      employeeCount: employees.length
    },
    membershipAndVerification: {
      totalUsers,
      verifiedUsers,
      rejectedOrBannedUsers: rejectedUsers + bannedUsers,
      rejectedUsers,
      bannedUsers,
      onboardingCompleted,
      verificationQueue
    },
    subscriptionOverview: {
      activeSubscriptions,
      planDistribution,
      paymentIssueCount
    },
    engagementAndMatchActivity: {
      likesCount,
      matchesCount,
      offlineMeetRequests: offlineMeetCaseCount,
      onlineMeetRequests: onlineMeetCaseCount,
      socialExchangeRequests: socialExchangeCaseCount,
      phoneExchangeRequests: phoneExchangeCaseCount,
      activeSocialExchangeRequests,
      activePhoneExchangeRequests
    },
    coordinationOperations: {
      pendingOfflineCoordination,
      pendingOnlineCoordination,
      pendingCoordinationTotal: pendingOfflineCoordination + pendingOnlineCoordination
    },
    queuesAndAttention: {
      verificationQueue,
      pendingMatchCoordinationQueue: pendingOfflineCoordination + pendingOnlineCoordination,
      paymentIssueQueue: paymentIssueCount,
      pendingOperationalFollowUps: unreadOperationalAlerts
    },
    employeeWorkload: {
      totalEmployees: employees.length,
      perEmployee: perEmployeeWorkload
    },
    alertsActivity: {
      recentWindowDays: 7,
      recentAlertsTotal: notificationsInPastWeek,
      unreadOperationalAlerts,
      byType: recentAlertBreakdown
    }
  };
}

export async function deactivateUser(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { deactivatedAt: new Date() }
  });
  emitAdminDashboardChanged();
  return { id: user.id, deactivatedAt: user.deactivatedAt };
}

export async function deleteUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    throw new HttpError(404, { message: "User not found" });
  }
  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    select: { id: true }
  });
  const matchIds = matches.map((match) => match.id);

  await prisma.$transaction(async (tx) => {
    await tx.notification.deleteMany({
      where: { OR: [{ userId }, { actorUserId: userId }] }
    });
    await tx.verificationRequest.deleteMany({ where: { userId } });
    await tx.verificationSlot.deleteMany({ where: { userId } });
    await tx.deviceToken.deleteMany({ where: { userId } });
    await tx.consent.deleteMany({ where: { matchId: { in: matchIds } } });
    await tx.phoneExchangeEvent.deleteMany({ where: { matchId: { in: matchIds } } });
    await tx.match.deleteMany({ where: { id: { in: matchIds } } });
    await tx.like.deleteMany({ where: { OR: [{ actorUserId: userId }, { targetUserId: userId }] } });
    await tx.report.deleteMany({
      where: { OR: [{ reporterId: userId }, { reportedUserId: userId }] }
    });
    await tx.refundRequest.deleteMany({ where: { userId } });
    await tx.payment.deleteMany({ where: { userId } });
    await tx.photo.deleteMany({ where: { userId } });
    await tx.profile.deleteMany({ where: { userId } });
    await tx.auditLog.deleteMany({ where: { actorUserId: userId } });
    await tx.user.delete({ where: { id: userId } });
  });

  emitAdminDashboardChanged();
  return { id: userId, deleted: true };
}

export async function listReports(): Promise<{ reports: ReportListItem[] }> {
  const reports: ReportListItem[] = await prisma.report.findMany({
    include: { reporter: { select: { id: true, phone: true } }, reportedUser: { select: { id: true, phone: true } } }
  });
  return { reports };
}

export async function listRefunds(): Promise<{ refunds: RefundListItem[] }> {
  const refunds: RefundListItem[] = await prisma.refundRequest.findMany({
    include: { user: { select: { id: true, phone: true, email: true } } }
  });
  return { refunds };
}

export async function approveRefund(refundId: string, actorUserId: string) {
  const refund = await prisma.refundRequest.update({
    where: { id: refundId },
    data: { status: "APPROVED", decisionAt: new Date() }
  });
  await prisma.payment.updateMany({
    where: { userId: refund.userId, status: "PAID" },
    data: { status: "REFUNDED" }
  });
  await prisma.auditLog.create({
    data: { actorUserId, action: "refund_approve", targetType: "RefundRequest", targetId: refund.id, metadata: {} }
  });
  emitAdminDashboardChanged();
  return { refund, refundAmount: 0.8 };
}

export async function denyRefund(refundId: string, actorUserId: string) {
  const refund = await prisma.refundRequest.update({
    where: { id: refundId },
    data: { status: "DENIED", decisionAt: new Date() }
  });
  await prisma.auditLog.create({
    data: { actorUserId, action: "refund_deny", targetType: "RefundRequest", targetId: refund.id, metadata: {} }
  });
  emitAdminDashboardChanged();
  return { refund };
}


async function pushVerificationAlert(options: {
  db?: Prisma.TransactionClient;
  userId: string;
  actorUserId: string;
  eventType: VerificationAlertEventType;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const db = options.db ?? prisma;
  const metadataSource = options.metadata;
  const metadata: Prisma.InputJsonValue =
    typeof metadataSource === "object" && metadataSource !== null && !Array.isArray(metadataSource)
      ? { ...(metadataSource as Prisma.InputJsonObject), eventType: options.eventType }
      : { eventType: options.eventType };
  const dedupeKey = `${options.userId}:VIDEO_VERIFICATION_UPDATE:verification`;
  const deepLinkUrl =
    options.eventType === "VERIFICATION_APPROVED"
      ? "/onboarding/payment"
      : "/onboarding/verification";

  await db.notification.upsert({
    where: { dedupeKey },
    update: {
      actorUserId: options.actorUserId,
      title: options.title,
      message: options.message,
      metadata,
      deepLinkUrl,
      isRead: false,
      readAt: null
    },
    create: {
      userId: options.userId,
      actorUserId: options.actorUserId,
      matchId: null,
      type: "VIDEO_VERIFICATION_UPDATE",
      dedupeKey,
      title: options.title,
      message: options.message,
      metadata,
      deepLinkUrl
    }
  });
}

function assertRequestIsActive(status: VerificationRequestStatus) {
  if (["COMPLETED", "REJECTED"].includes(status)) {
    throw new HttpError(409, { message: "This verification request is already closed." });
  }
}

async function resolveVerificationEscalationForRequest(options: {
  db: Prisma.TransactionClient;
  requestId: string;
}) {
  await options.db.escalationRequest.updateMany({
    where: {
      verificationRequestId: options.requestId,
      status: "OPEN"
    },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date()
    }
  });
}

async function syncVerificationAssignmentOnUser(options: {
  db: Prisma.TransactionClient;
  userId: string;
  actorUserId: string;
  assignedAt: Date;
  verificationStatus: "PENDING" | "IN_PROGRESS";
}) {
  await options.db.user.update({
    where: { id: options.userId },
    data: {
      assignedEmployeeId: options.actorUserId,
      assignedAt: options.assignedAt,
      videoVerificationStatus: options.verificationStatus,
      onboardingStep: "VIDEO_VERIFICATION_PENDING"
    }
  });
}

async function applyMeetLinkToVerificationRequest(options: {
  db: Prisma.TransactionClient;
  requestId: string;
  actorUserId: string;
  meetUrl: string;
  assignedAt?: Date | null;
}) {
  const now = new Date();
  const assignedAt = options.assignedAt ?? now;
  const result = await options.db.verificationRequest.updateMany({
    where: {
      id: options.requestId,
      assignedEmployeeId: options.actorUserId,
      status: { in: ["ASSIGNED", "IN_PROGRESS"] }
    },
    data: {
      status: "IN_PROGRESS",
      assignedEmployeeId: options.actorUserId,
      assignedAt,
      verificationLink: options.meetUrl,
      meetUrl: options.meetUrl,
      linkExpiresAt: new Date(now.getTime() + 5 * 60 * 1000)
    }
  });
  if (result.count === 0) return null;
  return options.db.verificationRequest.findUnique({ where: { id: options.requestId } });
}
export async function listVerificationRequestsForActor(options: {
  statusFilter?: string;
  statusView?: string;
  actorUserId: string;
  actorRole: "USER" | "EMPLOYEE" | "ADMIN";
  isAdmin: boolean;
}): Promise<{ statusView: VerificationWorkerView; requests: VerificationRequestListItem[] }> {
  if (options.actorRole === "USER") {
    throw new HttpError(403, { message: "Employee access required" });
  }

  await synchronizeVerificationRequests();

  const statusView = resolveVerificationWorkerView(options.statusView);
  const statusInView = statusView === "ALL" ? undefined : VERIFICATION_VIEW_STATUS_MAP[statusView];
  const records = await prisma.verificationRequest.findMany({
    where: {
      ...(options.statusFilter && options.statusFilter !== "ALL"
        ? { status: options.statusFilter as VerificationRequestStatus }
        : statusInView
        ? { status: { in: statusInView } }
        : {})
    },
    include: verificationRequestInclude,
    orderBy: [{ createdAt: "asc" }]
  });

  const requests: VerificationRequestListItem[] = records
    .map(mapVerificationRequestListItem)
    .sort(sortVerificationRequests);

  return { statusView, requests };
}

function ensureRequestOwnedByActor(
  request: { assignedEmployeeId: string | null },
  actorUserId: string,
  actionLabel: string
) {
  if (!request.assignedEmployeeId) {
    throw new HttpError(409, { message: `Claim this request before ${actionLabel}.` });
  }
  if (request.assignedEmployeeId !== actorUserId) {
    throw new HttpError(403, { message: "This request is assigned to another employee." });
  }
}

export async function startVerificationRequest(requestId: string, meetUrl: string, actorUserId: string, _isPrivileged: boolean) {
  await synchronizeVerificationRequests({ requestId });

  const existing = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    select: { assignedEmployeeId: true, assignedAt: true, status: true, meetUrl: true, userId: true }
  });
  if (!existing) throw new HttpError(404, { message: "Verification request not found" });
  assertRequestIsActive(existing.status);
  ensureRequestOwnedByActor(existing, actorUserId, "sending the meeting link");
  if (existing.status === "PENDING" || existing.status === "ESCALATED") {
    throw new HttpError(409, { message: "Claim this request before sending the meeting link." });
  }
  if (existing.status === "IN_PROGRESS" && existing.assignedEmployeeId === actorUserId && existing.meetUrl === meetUrl) {
    const request = await prisma.$transaction(async (tx) => {
      const current = await tx.verificationRequest.findUnique({ where: { id: requestId } });
      if (!current) return null;
      await syncVerificationAssignmentOnUser({
        db: tx,
        userId: current.userId,
        actorUserId,
        assignedAt: current.assignedAt ?? new Date(),
        verificationStatus: "IN_PROGRESS"
      });
      return current;
    });
    if (!request) throw new HttpError(404, { message: "Verification request not found" });
    const viewModel = await getVerificationRequestListItemById(request.id);
    if (!viewModel) throw new HttpError(404, { message: "Verification request not found" });
    return { request: viewModel };
  }

  const request = await prisma.$transaction(async (tx) => {
    const updated = await applyMeetLinkToVerificationRequest({
      db: tx,
      requestId,
      actorUserId,
      meetUrl,
      assignedAt: existing.assignedAt
    });
    if (!updated) {
      throw new HttpError(409, { message: "This request is no longer available for this action." });
    }
    await syncVerificationAssignmentOnUser({
      db: tx,
      userId: updated.userId,
      actorUserId,
      assignedAt: updated.assignedAt ?? new Date(),
      verificationStatus: "IN_PROGRESS"
    });
    await resolveVerificationEscalationForRequest({
      db: tx,
      requestId: updated.id
    });
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "verification_link_set",
        targetType: "VerificationRequest",
        targetId: updated.id,
        metadata: { meetUrl }
      }
    });
    await pushVerificationAlert({
      db: tx,
      userId: updated.userId,
      actorUserId,
      eventType: "VERIFICATION_ASSIGNED",
      title: "Verification Session Assigned",
      message: "Your video verification session has been scheduled. Please join using the secure link.",
      metadata: { meetUrl, cta: "Join verification call" }
    });
    return updated;
  });
  emitAlertsChanged([request.userId]);
  emitVerificationStatusChanged({ userId: request.userId, requestId: request.id, status: request.status });
  emitSessionStateChanged([request.userId], "verification_started");
  emitAdminAuditLogsChanged();
  emitOpsCaseActivityChanged({ caseType: "VERIFICATION", caseId: request.id });
  emitVerificationQueueChanged(request.id);
  emitAdminDashboardChanged();
  const viewModel = await getVerificationRequestListItemById(request.id);
  if (!viewModel) throw new HttpError(404, { message: "Verification request not found" });
  return { request: viewModel };
}

export async function assignVerificationRequest(requestId: string, actorUserId: string) {
  await synchronizeVerificationRequests({ requestId });

  const existing = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    select: { status: true, assignedEmployeeId: true, assignedAt: true, userId: true }
  });
  if (!existing) throw new HttpError(404, { message: "Verification request not found" });
  assertRequestIsActive(existing.status);
  if (existing.assignedEmployeeId && existing.assignedEmployeeId !== actorUserId) {
    throw new HttpError(409, { message: "This request is already assigned to another employee." });
  }
  if (existing.status === "IN_PROGRESS") {
    if (existing.assignedEmployeeId !== actorUserId) {
      throw new HttpError(409, { message: "This verification session is already in progress with another employee." });
    }
    const request = await prisma.$transaction(async (tx) => {
      const current = await tx.verificationRequest.findUnique({ where: { id: requestId } });
      if (!current) return null;
      await syncVerificationAssignmentOnUser({
        db: tx,
        userId: current.userId,
        actorUserId,
        assignedAt: current.assignedAt ?? new Date(),
        verificationStatus: "IN_PROGRESS"
      });
      return current;
    });
    if (!request) throw new HttpError(404, { message: "Verification request not found" });
    const viewModel = await getVerificationRequestListItemById(request.id);
    if (!viewModel) throw new HttpError(404, { message: "Verification request not found" });
    return { request: viewModel };
  }
  const now = new Date();
  const assignedAt = existing.assignedEmployeeId === actorUserId ? existing.assignedAt ?? now : now;
  const request = await prisma.$transaction(async (tx) => {
    const claimResult = await tx.verificationRequest.updateMany({
      where: {
        id: requestId,
        status: { in: ["PENDING", "ESCALATED", "ASSIGNED"] },
        OR: [{ assignedEmployeeId: null }, { assignedEmployeeId: actorUserId }]
      },
      data: {
        status: "ASSIGNED",
        assignedEmployeeId: actorUserId,
        assignedAt
      }
    });
    if (claimResult.count === 0) {
      throw new HttpError(409, { message: "This request is already assigned to another employee." });
    }
    const updated = await tx.verificationRequest.findUnique({ where: { id: requestId } });
    if (!updated) return null;
    await syncVerificationAssignmentOnUser({
      db: tx,
      userId: updated.userId,
      actorUserId,
      assignedAt: updated.assignedAt ?? assignedAt,
      verificationStatus: "PENDING"
    });
    await resolveVerificationEscalationForRequest({
      db: tx,
      requestId: updated.id
    });
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "verification_assigned",
        targetType: "VerificationRequest",
        targetId: updated.id,
        metadata: {}
      }
    });
    await pushVerificationAlert({
      db: tx,
      userId: updated.userId,
      actorUserId,
      eventType: "VERIFICATION_ASSIGNED",
      title: "Verification Assigned",
      message: "Our team has assigned your verification case and will guide the next step shortly.",
      metadata: {}
    });
    return updated;
  });
  if (!request) throw new HttpError(404, { message: "Verification request not found" });
  emitAlertsChanged([request.userId]);
  emitVerificationStatusChanged({ userId: request.userId, requestId: request.id, status: request.status });
  emitSessionStateChanged([request.userId], "verification_assigned");
  emitAdminAuditLogsChanged();
  emitOpsCaseActivityChanged({ caseType: "VERIFICATION", caseId: request.id });
  emitVerificationQueueChanged(request.id);
  emitAdminDashboardChanged();
  const viewModel = await getVerificationRequestListItemById(request.id);
  if (!viewModel) throw new HttpError(404, { message: "Verification request not found" });
  return { request: viewModel };
}

export async function approveVerificationRequest(requestId: string, actorUserId: string, _isPrivileged: boolean) {
  await synchronizeVerificationRequests({ requestId });

  const existing = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    select: { assignedEmployeeId: true, assignedAt: true, userId: true, status: true }
  });
  if (!existing) throw new HttpError(404, { message: "Verification request not found" });
  assertRequestIsActive(existing.status);
  ensureRequestOwnedByActor(existing, actorUserId, "approving it");
  const request = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const updated = await tx.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: "COMPLETED",
        completedAt: now,
        verificationLink: null,
        meetUrl: null,
        linkExpiresAt: null,
        decidedAt: now,
        decidedBy: actorUserId,
        assignedEmployeeId: existing.assignedEmployeeId ?? actorUserId,
        assignedAt: existing.assignedAt ?? now
      }
    });
    await tx.user.update({
      where: { id: updated.userId },
      data: {
        status: "APPROVED",
        verifiedAt: now,
        isVideoVerified: true,
        videoVerificationStatus: "APPROVED",
        onboardingStep: "VIDEO_VERIFIED",
        verifiedByEmployeeId: actorUserId,
        assignedEmployeeId: actorUserId,
        assignedAt: existing.assignedAt ?? now
      }
    });
    await resolveVerificationEscalationForRequest({
      db: tx,
      requestId: updated.id
    });
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "verification_approved",
        targetType: "VerificationRequest",
        targetId: updated.id,
        metadata: {}
      }
    });
    await pushVerificationAlert({
      db: tx,
      userId: updated.userId,
      actorUserId,
      eventType: "VERIFICATION_APPROVED",
      title: "Verification Approved",
      message: "Your video verification is complete. Please proceed with membership payment.",
      metadata: {}
    });
    return updated;
  });
  emitAlertsChanged([request.userId]);
  emitVerificationStatusChanged({ userId: request.userId, requestId: request.id, status: request.status });
  emitSessionStateChanged([request.userId], "verification_approved");
  emitAdminAuditLogsChanged();
  emitOpsCaseActivityChanged({ caseType: "VERIFICATION", caseId: request.id });
  emitVerificationQueueChanged(request.id);
  emitAdminDashboardChanged();
  const viewModel = await getVerificationRequestListItemById(request.id);
  if (!viewModel) throw new HttpError(404, { message: "Verification request not found" });
  return { request: viewModel };
}

export async function rejectVerificationRequest(requestId: string, actorUserId: string, reason: string, _isPrivileged: boolean) {
  await synchronizeVerificationRequests({ requestId });

  const existing = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
    select: { assignedEmployeeId: true, assignedAt: true, status: true }
  });
  if (!existing) throw new HttpError(404, { message: "Verification request not found" });
  assertRequestIsActive(existing.status);
  ensureRequestOwnedByActor(existing, actorUserId, "rejecting it");
  const normalizedReason = reason.trim();
  const marksFraud = /(fake|fraud|impersonat|scam)/i.test(normalizedReason);
  const request = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const updated = await tx.verificationRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        completedAt: now,
        verificationLink: null,
        meetUrl: null,
        linkExpiresAt: null,
        decidedAt: now,
        decidedBy: actorUserId,
        assignedEmployeeId: existing.assignedEmployeeId ?? actorUserId,
        assignedAt: existing.assignedAt ?? now,
        reason: normalizedReason
      }
    });
    await tx.user.update({
      where: { id: updated.userId },
      data: {
        status: marksFraud ? "BANNED" : "REJECTED",
        isVideoVerified: false,
        videoVerificationStatus: "REJECTED",
        onboardingStep: "VIDEO_VERIFICATION_PENDING"
      }
    });
    await resolveVerificationEscalationForRequest({
      db: tx,
      requestId: updated.id
    });
    await tx.auditLog.create({
      data: {
        actorUserId,
        action: "verification_rejected",
        targetType: "VerificationRequest",
        targetId: updated.id,
        metadata: { reason: normalizedReason, markedFraud: marksFraud }
      }
    });
    await pushVerificationAlert({
      db: tx,
      userId: updated.userId,
      actorUserId,
      eventType: "VERIFICATION_REJECTED",
      title: "Verification Needs Attention",
      message: "Your verification could not be approved yet. Please review the update and reconnect with support.",
      metadata: { reason: normalizedReason }
    });
    return updated;
  });
  emitAlertsChanged([request.userId]);
  emitVerificationStatusChanged({ userId: request.userId, requestId: request.id, status: request.status });
  emitSessionStateChanged([request.userId], "verification_rejected");
  emitAdminAuditLogsChanged();
  emitOpsCaseActivityChanged({ caseType: "VERIFICATION", caseId: request.id });
  emitVerificationQueueChanged(request.id);
  emitAdminDashboardChanged();
  const viewModel = await getVerificationRequestListItemById(request.id);
  if (!viewModel) throw new HttpError(404, { message: "Verification request not found" });
  return { request: viewModel };
}

export async function shiftPaymentDate(options: { userId: string; daysBack: number }) {
  const payment = await prisma.payment.findFirst({
    where: { userId: options.userId, status: "PAID" },
    orderBy: { paidAt: "desc" }
  });
  if (!payment?.paidAt) {
    throw new HttpError(404, { message: "Payment not found" });
  }
  const shifted = new Date(payment.paidAt.getTime() - options.daysBack * 24 * 60 * 60 * 1000);
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { paidAt: shifted }
  });
  return updated;
}

export async function getEmployeeWorkloads() {
  const employees = await listEmployeeWorkloads();
  return { employees, capacity: { softLimit: 30, hardLimit: 40 } };
}
