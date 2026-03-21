import { Prisma, VerificationRequestStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";
import {
  emitAdminAuditLogsChanged,
  emitAdminDashboardChanged,
  emitOpsCaseActivityChanged,
  emitSessionStateChanged,
  emitVerificationQueueChanged,
  emitVerificationStatusChanged
} from "../live/liveEventBroker";

const ACTIVE_VERIFICATION_STATUSES = ["PENDING", "ESCALATED", "ASSIGNED", "IN_PROGRESS"] as const;
const CLOSED_VERIFICATION_STATUSES = ["COMPLETED", "REJECTED"] as const;
const RESPONSE_TIMEOUT_MS = 5 * 60 * 1000;

type ActiveVerificationStatus = (typeof ACTIVE_VERIFICATION_STATUSES)[number];
type VerificationRequestRecord = Prisma.VerificationRequestGetPayload<{
  include: { escalationRequest: true };
}>;

function isEscalationEligible(request: {
  status: VerificationRequestStatus;
  assignedEmployeeId: string | null;
  createdAt: Date;
}) {
  if (request.status !== "PENDING") return false;
  if (request.assignedEmployeeId) return false;
  return request.createdAt.getTime() + RESPONSE_TIMEOUT_MS <= Date.now();
}

function mapUserStatus(requestStatus: VerificationRequestStatus) {
  if (requestStatus === "PENDING" || requestStatus === "ESCALATED") return "PENDING" as const;
  if (requestStatus === "ASSIGNED" || requestStatus === "IN_PROGRESS") return "ASSIGNED" as const;
  if (requestStatus === "COMPLETED") return "APPROVED" as const;
  return "REJECTED" as const;
}

async function resolveOpenEscalationForRequest(options: {
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

async function reopenExpiredMeetLinkIfNeeded(request: VerificationRequestRecord) {
  if (request.status !== "IN_PROGRESS") return request;
  if (!request.linkExpiresAt || request.linkExpiresAt.getTime() > Date.now()) return request;

  const updated = await prisma.$transaction(async (tx) => {
    const nextStatus: ActiveVerificationStatus = request.assignedEmployeeId ? "ASSIGNED" : "PENDING";
    const refreshed = await tx.verificationRequest.update({
      where: { id: request.id },
      data: {
        status: nextStatus,
        verificationLink: null,
        meetUrl: null,
        linkExpiresAt: null
      },
      include: { escalationRequest: true }
    });

    await tx.user.update({
      where: { id: refreshed.userId },
      data: {
        videoVerificationStatus: "PENDING",
        onboardingStep: "VIDEO_VERIFICATION_PENDING"
      }
    });

    return refreshed;
  });

  emitVerificationStatusChanged({ userId: updated.userId, requestId: updated.id, status: updated.status });
  emitSessionStateChanged([updated.userId], "verification_reopened");
  emitVerificationQueueChanged(updated.id);
  emitAdminDashboardChanged();

  return updated;
}

export async function synchronizeVerificationRequests(options?: { userId?: string; requestId?: string }) {
  const now = new Date();
  const requestScope: Prisma.VerificationRequestWhereInput = {
    ...(options?.userId ? { userId: options.userId } : {}),
    ...(options?.requestId ? { id: options.requestId } : {})
  };

  const expiredMeetLinks = await prisma.verificationRequest.findMany({
    where: {
      ...requestScope,
      status: "IN_PROGRESS",
      linkExpiresAt: { not: null, lte: now }
    },
    include: { escalationRequest: true }
  });

  for (const request of expiredMeetLinks) {
    await reopenExpiredMeetLinkIfNeeded(request);
  }
}

function buildVerificationRequestInclude() {
  return {
    escalationRequest: true
  } satisfies Prisma.VerificationRequestInclude;
}

async function logVerificationRequestCreated(requestId: string, userId: string) {
  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      action: "verification_requested",
      targetType: "VerificationRequest",
      targetId: requestId,
      metadata: {}
    }
  });

  emitAdminAuditLogsChanged();
  emitOpsCaseActivityChanged({
    caseType: "VERIFICATION",
    caseId: requestId
  });
}

export async function createVerificationRequest(options: { userId: string }) {
  await synchronizeVerificationRequests({ userId: options.userId });

  const include = buildVerificationRequestInclude();
  const existing = await prisma.verificationRequest.findFirst({
    where: { userId: options.userId, status: { in: [...ACTIVE_VERIFICATION_STATUSES] } },
    include,
    orderBy: { createdAt: "desc" }
  });
  if (existing) {
    return existing;
  }

  const latestClosed = await prisma.verificationRequest.findFirst({
    where: { userId: options.userId, status: { in: [...CLOSED_VERIFICATION_STATUSES] } },
    include,
    orderBy: { createdAt: "desc" }
  });
  if (latestClosed) {
    return latestClosed;
  }

  const request = await prisma.$transaction(async (tx) => {
    const created = await tx.verificationRequest.create({
      data: { userId: options.userId, status: "PENDING" },
      include
    });

    await tx.user.update({
      where: { id: options.userId },
      data: {
        isVideoVerified: false,
        videoVerificationStatus: "PENDING",
        onboardingStep: "VIDEO_VERIFICATION_PENDING"
      }
    });

    return created;
  });

  await logVerificationRequestCreated(request.id, options.userId);
  emitSessionStateChanged([options.userId], "verification_requested");
  emitVerificationStatusChanged({ userId: options.userId, requestId: request.id, status: request.status });
  emitVerificationQueueChanged(request.id);
  emitAdminDashboardChanged();

  return request;
}

export async function getLatestVerificationRequest(userId: string) {
  await synchronizeVerificationRequests({ userId });

  const request = await prisma.verificationRequest.findFirst({
    where: { userId },
    include: buildVerificationRequestInclude(),
    orderBy: { createdAt: "desc" }
  });

  return { request };
}

export async function getVerificationStatusPayload(userId: string) {
  const { request } = await getLatestVerificationRequest(userId);

  if (!request) {
    return {
      request: null,
      status: "NOT_REQUESTED" as const,
      displayStatus: "PENDING" as const,
      meetUrl: null,
      remainingSeconds: RESPONSE_TIMEOUT_MS / 1000,
      requestedAt: null,
      escalationRequestedAt: null
    };
  }

  const remainingMs =
    request.status === "PENDING"
      ? Math.max(0, request.createdAt.getTime() + RESPONSE_TIMEOUT_MS - Date.now())
      : 0;

  return {
    request,
    status: request.status,
    displayStatus: mapUserStatus(request.status),
    meetUrl: request.meetUrl ?? request.verificationLink ?? null,
    remainingSeconds: Math.floor(remainingMs / 1000),
    requestedAt: request.createdAt.toISOString(),
    escalationRequestedAt: request.escalationRequest?.requestedAt.toISOString() ?? null
  };
}

export async function requestWhatsAppVerificationHelp(userId: string) {
  await synchronizeVerificationRequests({ userId });

  const latest = await prisma.verificationRequest.findFirst({
    where: { userId },
    include: buildVerificationRequestInclude(),
    orderBy: { createdAt: "desc" }
  });

  if (!latest) {
    throw new HttpError(400, { message: "Please request verification first." });
  }

  if (latest.status === "ESCALATED" && latest.escalationRequest?.status === "OPEN") {
    return {
      ok: true,
      requestedAt: latest.escalationRequest.requestedAt.toISOString()
    };
  }

  if (latest.status === "ASSIGNED") {
    throw new HttpError(409, {
      message: "An executive has already accepted your request. Your meeting link will arrive shortly."
    });
  }

  if (latest.status === "IN_PROGRESS") {
    throw new HttpError(409, {
      message: "Your verification session is already in progress."
    });
  }

  if (latest.status === "COMPLETED" || latest.status === "REJECTED") {
    throw new HttpError(400, { message: "This verification request is already closed." });
  }

  if (!isEscalationEligible(latest)) {
    throw new HttpError(409, {
      message: "Please wait for the five-minute acceptance window before escalating to WhatsApp."
    });
  }

  const escalated = await prisma.$transaction(async (tx) => {
    const requestedAt = new Date();
    const request = await tx.verificationRequest.update({
      where: { id: latest.id },
      data: {
        status: "ESCALATED"
      },
      include: buildVerificationRequestInclude()
    });

    const escalation = await tx.escalationRequest.upsert({
      where: { verificationRequestId: latest.id },
      update: {
        status: "OPEN",
        requestedAt,
        resolvedAt: null
      },
      create: {
        verificationRequestId: latest.id,
        userId,
        requestedAt
      }
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        videoVerificationStatus: "PENDING",
        onboardingStep: "VIDEO_VERIFICATION_PENDING"
      }
    });

    await tx.auditLog.create({
      data: {
        actorUserId: userId,
        action: "verification_whatsapp_help_requested",
        targetType: "VerificationRequest",
        targetId: latest.id,
        metadata: {
          note: "Manual employee follow-up required. Do not automate responses.",
          requestedAt: escalation.requestedAt.toISOString()
        }
      }
    });

    return {
      request,
      escalation
    };
  });

  emitAdminAuditLogsChanged();
  emitOpsCaseActivityChanged({
    caseType: "VERIFICATION",
    caseId: escalated.request.id
  });
  emitSessionStateChanged([userId], "verification_help_requested");
  emitVerificationStatusChanged({ userId, requestId: escalated.request.id, status: "ESCALATED" });
  emitVerificationQueueChanged(escalated.request.id);
  emitAdminDashboardChanged();

  return {
    ok: true,
    requestedAt: escalated.escalation.requestedAt.toISOString()
  };
}
