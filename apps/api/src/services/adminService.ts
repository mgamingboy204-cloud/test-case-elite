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

type VerificationRequestListItem = Prisma.VerificationRequestGetPayload<{
  include: { user: { select: { id: true; phone: true; email: true } } };
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

type VerificationWorkerView = "ACTIVE" | "COMPLETED" | "REJECTED" | "TIMEOUT" | "ALL";

const VERIFICATION_VIEW_STATUS_MAP: Record<Exclude<VerificationWorkerView, "ALL">, VerificationRequestStatus[]> = {
  ACTIVE: ["REQUESTED", "ASSIGNED", "IN_PROGRESS"],
  COMPLETED: ["COMPLETED"],
  REJECTED: ["REJECTED"],
  TIMEOUT: ["TIMED_OUT"]
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

export async function approveUser(userId: string, actorUserId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { status: "APPROVED" }
  });
  await prisma.auditLog.create({
    data: { actorUserId, action: "approve", targetType: "User", targetId: user.id, metadata: {} }
  });
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
  const pendingVerificationStatuses: VerificationRequestStatus[] = ["REQUESTED", "ASSIGNED", "IN_PROGRESS"];
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
    prisma.user.count({ where: { deletedAt: null, status: "APPROVED", isVideoVerified: true } }),
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
          in: [
            "VIDEO_VERIFICATION_UPDATE",
            "OFFLINE_MEET_REQUEST",
            "OFFLINE_MEET_TIMEOUT",
            "OFFLINE_MEET_NO_OVERLAP",
            "ONLINE_MEET_REQUEST",
            "ONLINE_MEET_TIMEOUT",
            "ONLINE_MEET_NO_OVERLAP",
            "PHONE_EXCHANGE_REQUEST",
            "SOCIAL_EXCHANGE_REQUEST"
          ]
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
    .filter((entry) => [
      NotificationType.VIDEO_VERIFICATION_UPDATE,
      NotificationType.OFFLINE_MEET_REQUEST,
      NotificationType.OFFLINE_MEET_TIMEOUT,
      NotificationType.ONLINE_MEET_REQUEST,
      NotificationType.ONLINE_MEET_TIMEOUT,
      NotificationType.SOCIAL_EXCHANGE_REQUEST,
      NotificationType.PHONE_EXCHANGE_REQUEST
    ].includes(entry.type))
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
  return { refund };
}


async function pushVerificationAlert(options: {
  userId: string;
  actorUserId: string;
  title: string;
  message: string;
  metadata?: Prisma.InputJsonValue;
}) {
  await prisma.notification.upsert({
    where: {
      userId_type_actorUserId_matchId: {
        userId: options.userId,
        type: "VIDEO_VERIFICATION_UPDATE",
        actorUserId: options.actorUserId,
        matchId: undefined as any
      }
    },
    update: {
      title: options.title,
      message: options.message,
      metadata: options.metadata ?? {},
      createdAt: new Date(),
      isRead: false,
      readAt: null,
      deepLinkUrl: "/onboarding/verification"
    },
    create: {
      userId: options.userId,
      actorUserId: options.actorUserId,
      type: "VIDEO_VERIFICATION_UPDATE",
      title: options.title,
      message: options.message,
      metadata: options.metadata ?? {},
      deepLinkUrl: "/onboarding/verification"
    }
  });
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

  const isPrivileged = options.isAdmin || options.actorRole === "ADMIN";
  const statusView = resolveVerificationWorkerView(options.statusView);
  const statusInView = statusView === "ALL" ? undefined : VERIFICATION_VIEW_STATUS_MAP[statusView];
  const requests: VerificationRequestListItem[] = await prisma.verificationRequest.findMany({
    where: {
      ...(options.statusFilter && options.statusFilter !== "ALL"
        ? { status: options.statusFilter as VerificationRequestStatus }
        : statusInView
        ? { status: { in: statusInView } }
        : {}),
      ...(!isPrivileged
        ? {
            OR: [{ assignedEmployeeId: null }, { assignedEmployeeId: options.actorUserId }]
          }
        : {})
    },
    include: { user: { select: { id: true, phone: true, email: true } } },
    orderBy: { createdAt: "desc" }
  });
  return { statusView, requests };
}

function ensureAssignableToActor(caseItem: { assignedEmployeeId: string | null }, actorUserId: string, isPrivileged: boolean) {
  if (isPrivileged) return;
  if (caseItem.assignedEmployeeId && caseItem.assignedEmployeeId !== actorUserId) {
    throw new HttpError(403, { message: "This request is assigned to another employee." });
  }
}

export async function startVerificationRequest(requestId: string, meetUrl: string, actorUserId: string, isPrivileged: boolean) {
  const existing = await prisma.verificationRequest.findUnique({ where: { id: requestId }, select: { assignedEmployeeId: true } });
  if (!existing) throw new HttpError(404, { message: "Verification request not found" });
  ensureAssignableToActor(existing, actorUserId, isPrivileged);
  const now = new Date();
  const request = await prisma.verificationRequest.update({
    where: { id: requestId },
    data: {
      status: "IN_PROGRESS",
      assignedEmployeeId: actorUserId,
      assignedAt: now,
      verificationLink: meetUrl,
      meetUrl,
      linkExpiresAt: new Date(now.getTime() + 5 * 60 * 1000)
    }
  });
  await prisma.user.update({
    where: { id: request.userId },
    data: { videoVerificationStatus: "IN_PROGRESS", onboardingStep: "VIDEO_VERIFICATION_PENDING" }
  });
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "verification_link_set",
      targetType: "VerificationRequest",
      targetId: request.id,
      metadata: { meetUrl }
    }
  });
  await pushVerificationAlert({
    userId: request.userId,
    actorUserId,
    title: "Verification Session Assigned",
    message: "Your video verification session has been scheduled. Please join using the secure link.",
    metadata: { eventType: "VERIFICATION_ASSIGNED", meetUrl, cta: "Join verification call" }
  });
  return { request };
}

export async function assignVerificationRequest(requestId: string, actorUserId: string) {
  const existing = await prisma.verificationRequest.findUnique({ where: { id: requestId }, select: { status: true } });
  if (!existing) throw new HttpError(404, { message: "Verification request not found" });
  if (!["REQUESTED", "ASSIGNED", "IN_PROGRESS"].includes(existing.status)) {
    throw new HttpError(409, { message: "This verification request is already closed." });
  }
  const now = new Date();
  const claimResult = await prisma.verificationRequest.updateMany({
    where: {
      id: requestId,
      OR: [{ assignedEmployeeId: null }, { assignedEmployeeId: actorUserId }]
    },
    data: {
      status: "ASSIGNED",
      assignedEmployeeId: actorUserId,
      assignedAt: now
    }
  });
  if (claimResult.count === 0) {
    throw new HttpError(409, { message: "This request is already assigned to another employee." });
  }
  const request = await prisma.verificationRequest.findUnique({ where: { id: requestId } });
  if (!request) throw new HttpError(404, { message: "Verification request not found" });
  await prisma.user.update({
    where: { id: request.userId },
    data: { videoVerificationStatus: "IN_PROGRESS", onboardingStep: "VIDEO_VERIFICATION_PENDING" }
  });
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "verification_assigned",
      targetType: "VerificationRequest",
      targetId: request.id,
      metadata: {}
    }
  });
  await pushVerificationAlert({
    userId: request.userId,
    actorUserId,
    title: "Verification Assigned",
    message: "Our team has assigned your verification case and will guide the next step shortly.",
    metadata: { eventType: "VERIFICATION_ASSIGNED" }
  });
  return { request };
}

export async function approveVerificationRequest(requestId: string, actorUserId: string, isPrivileged: boolean) {
  const existing = await prisma.verificationRequest.findUnique({ where: { id: requestId }, select: { assignedEmployeeId: true, userId: true } });
  if (!existing) throw new HttpError(404, { message: "Verification request not found" });
  ensureAssignableToActor(existing, actorUserId, isPrivileged);
  const now = new Date();
  const request = await prisma.verificationRequest.update({
    where: { id: requestId },
     data: {
      status: "COMPLETED",
      completedAt: now,
      verificationLink: undefined,
      meetUrl: undefined,
      linkExpiresAt: undefined,
      decidedAt: now,
      decidedBy: actorUserId
    }

  });
  await prisma.user.update({
    where: { id: request.userId },
    data: {
      status: "APPROVED",
      verifiedAt: now,
      videoVerificationStatus: "APPROVED",
      onboardingStep: "VIDEO_VERIFIED",
      verifiedByEmployeeId: actorUserId,
      assignedEmployeeId: actorUserId,
      assignedAt: now
    }
  });
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "verification_approved",
      targetType: "VerificationRequest",
      targetId: request.id,
      metadata: {}
    }
  });
  await pushVerificationAlert({
    userId: request.userId,
    actorUserId,
    title: "Verification Approved",
    message: "Your video verification is complete. Please proceed with membership payment.",
    metadata: { eventType: "VERIFICATION_APPROVED" }
  });
  return { request };
}

export async function rejectVerificationRequest(requestId: string, actorUserId: string, reason: string, isPrivileged: boolean) {
  const existing = await prisma.verificationRequest.findUnique({ where: { id: requestId }, select: { assignedEmployeeId: true } });
  if (!existing) throw new HttpError(404, { message: "Verification request not found" });
  ensureAssignableToActor(existing, actorUserId, isPrivileged);
  const normalizedReason = reason.trim();
  const marksFraud = /(fake|fraud|impersonat|scam)/i.test(normalizedReason);
  const now = new Date();
  const request = await prisma.verificationRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      completedAt: now,
      verificationLink: undefined,
      meetUrl: undefined,
      linkExpiresAt: undefined,
      decidedAt: now,
      decidedBy: actorUserId,
      reason: normalizedReason
    }

  });
  await prisma.user.update({
    where: { id: request.userId },
    data: {
      status: marksFraud ? "BANNED" : "REJECTED",
      videoVerificationStatus: "REJECTED",
      onboardingStep: "VIDEO_VERIFICATION_PENDING"
    }
  });
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "verification_rejected",
      targetType: "VerificationRequest",
      targetId: request.id,
      metadata: { reason: normalizedReason, markedFraud: marksFraud }
    }
  });
  await pushVerificationAlert({
    userId: request.userId,
    actorUserId,
    title: "Verification Needs Attention",
    message: "Your verification could not be approved yet. Please review the update and reconnect with support.",
    metadata: { eventType: "VERIFICATION_REJECTED", reason: normalizedReason }
  });
  return { request };
}

async function findOrCreateVerificationRequest(userId: string) {
  const existing = await prisma.verificationRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
  if (existing) return existing;
  return prisma.verificationRequest.create({
    data: { userId, status: "REQUESTED" }
  });
}

export async function setVerificationMeetLink(userId: string, meetUrl: string, actorUserId: string) {
  const now = new Date();
  const request = await findOrCreateVerificationRequest(userId);
  const updated = await prisma.verificationRequest.update({
    where: { id: request.id },
    data: {
      status: "IN_PROGRESS",
      assignedEmployeeId: actorUserId,
      assignedAt: now,
      meetUrl,
      verificationLink: meetUrl,
      linkExpiresAt: new Date(now.getTime() + 5 * 60 * 1000)
    }
  });
  await prisma.user.update({
    where: { id: userId },
    data: { videoVerificationStatus: "IN_PROGRESS", onboardingStep: "VIDEO_VERIFICATION_PENDING" }
  });
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "verification_link_set",
      targetType: "VerificationRequest",
      targetId: updated.id,
      metadata: { meetUrl }
    }
  });
  await pushVerificationAlert({
    userId,
    actorUserId,
    title: "Verification Session Assigned",
    message: "Your video verification session has been scheduled. Please join using the secure link.",
    metadata: { eventType: "VERIFICATION_ASSIGNED", meetUrl, cta: "Join verification call" }
  });
  return { request: updated };
}

export async function approveVerificationForUser(userId: string, actorUserId: string, reason?: string | null) {
  const request = await findOrCreateVerificationRequest(userId);
  const now = new Date();
  const updated = await prisma.verificationRequest.update({
    where: { id: request.id },
    data: {
      status: "COMPLETED",
      completedAt: now,
      meetUrl: undefined,
      verificationLink: undefined,
      linkExpiresAt: undefined,
      decidedAt: now,
      decidedBy: actorUserId,
      reason: reason?.trim() || undefined
    }

  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "APPROVED",
      verifiedAt: now,
      videoVerificationStatus: "APPROVED",
      onboardingStep: "VIDEO_VERIFIED",
      verifiedByEmployeeId: actorUserId,
      assignedEmployeeId: actorUserId,
      assignedAt: now
    }
  });
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "verification_approved",
      targetType: "VerificationRequest",
      targetId: updated.id,
      metadata: { reason: reason?.trim() || undefined }

    }
  });
  await pushVerificationAlert({
    userId,
    actorUserId,
    title: "Verification Approved",
    message: "Your video verification is complete. Please proceed with membership payment.",
    metadata: { eventType: "VERIFICATION_APPROVED" }
  });
  return { request: updated };
}

export async function rejectVerificationForUser(userId: string, actorUserId: string, reason: string) {
  const request = await findOrCreateVerificationRequest(userId);
  const normalizedReason = reason.trim();
  const marksFraud = /(fake|fraud|impersonat|scam)/i.test(normalizedReason);
  const now = new Date();
  const updated = await prisma.verificationRequest.update({
    where: { id: request.id },
   data: {
      status: "REJECTED",
      completedAt: now,
      meetUrl: undefined,
      verificationLink: undefined,
      linkExpiresAt: undefined,
      decidedAt: now,
      decidedBy: actorUserId,
      reason: normalizedReason
    }

  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: marksFraud ? "BANNED" : "REJECTED",
      videoVerificationStatus: "REJECTED",
      onboardingStep: "VIDEO_VERIFICATION_PENDING"
    }
  });
  await prisma.auditLog.create({
    data: {
      actorUserId,
      action: "verification_rejected",
      targetType: "VerificationRequest",
      targetId: updated.id,
      metadata: { reason: normalizedReason, markedFraud: marksFraud }
    }
  });
  await pushVerificationAlert({
    userId,
    actorUserId,
    title: "Verification Needs Attention",
    message: "Your verification could not be approved yet. Please review the update and reconnect with support.",
    metadata: { eventType: "VERIFICATION_REJECTED", reason: normalizedReason }
  });
  return { request: updated };
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
