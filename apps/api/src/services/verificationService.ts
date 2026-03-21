import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Prisma, VerificationRequestStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { HttpError } from "../utils/httpErrors";
import {
  emitAdminAuditLogsChanged,
  emitAdminDashboardChanged,
  emitOpsCaseActivityChanged,
  emitSessionStateChanged,
  emitVerificationQueueChanged,
  emitVerificationStatusChanged
} from "../live/liveEventBroker";

const ACTIVE_VERIFICATION_STATUSES = ["REQUESTED", "ASSIGNED", "IN_PROGRESS"] as const;
const USER_RETRYABLE_STATUSES = ["REJECTED", "TIMED_OUT"] as const;
const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024;
const RESPONSE_TIMEOUT_MS = 5 * 60 * 1000;
const WHATSAPP_HELP_PREFIX = "WHATSAPP_HELP_REQUESTED:";
const TIMEOUT_REASON = "Timed out without employee response";
const allowedVideoMimeTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function calculateBase64Size(base64: string) {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return (base64.length * 3) / 4 - padding;
}

function resolveVideoExtension(mimeType: string) {
  if (mimeType === "video/webm") return "webm";
  if (mimeType === "video/quicktime") return "mov";
  return "mp4";
}

function ensureVerificationUploadsDir() {
  if (env.STORAGE_PROVIDER !== "local") return;
  const dir = path.join(process.cwd(), "uploads", "verification");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function isRequestExpired(request: { status: VerificationRequestStatus; createdAt: Date }) {
  if (request.status !== "REQUESTED") return false;
  return request.createdAt.getTime() + RESPONSE_TIMEOUT_MS <= Date.now();
}

type VerificationRequestRecord = Awaited<ReturnType<typeof prisma.verificationRequest.findFirst>>;

function hasWhatsAppHelpReason(reason?: string | null) {
  return typeof reason === "string" && reason.startsWith(WHATSAPP_HELP_PREFIX);
}

function buildWhatsAppHelpReason(requestedAt: string) {
  return `${WHATSAPP_HELP_PREFIX}${requestedAt}`;
}

function getWhatsAppHelpRequestedAt(reason?: string | null) {
  if (typeof reason !== "string" || !hasWhatsAppHelpReason(reason)) return null;
  return reason.replace(WHATSAPP_HELP_PREFIX, "");
}

async function markTimedOutIfNeeded(request: NonNullable<VerificationRequestRecord>) {
  if (!isRequestExpired(request)) return request;
  const decidedAt = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const updated = await tx.verificationRequest.update({
      where: { id: request.id },
      data: {
        status: "TIMED_OUT",
        reason: hasWhatsAppHelpReason(request.reason) ? request.reason : TIMEOUT_REASON,
        verificationLink: null,
        meetUrl: null,
        linkExpiresAt: null,
        decidedAt
      }
    });

    await tx.user.update({
      where: { id: updated.userId },
      data: {
        videoVerificationStatus: "PENDING",
        onboardingStep: "VIDEO_VERIFICATION_PENDING"
      }
    });

    return updated;
  });

  emitVerificationStatusChanged({ userId: updated.userId, requestId: updated.id, status: updated.status });
  emitSessionStateChanged([updated.userId], "verification_timed_out");
  emitVerificationQueueChanged(updated.id);
  emitAdminDashboardChanged();

  return updated;
}

async function reopenExpiredMeetLinkIfNeeded(request: NonNullable<VerificationRequestRecord>) {
  if (request.status !== "IN_PROGRESS") return request;
  if (!request.linkExpiresAt || request.linkExpiresAt.getTime() > Date.now()) return request;

  const updated = await prisma.$transaction(async (tx) => {
    const nextStatus = request.assignedEmployeeId ? "ASSIGNED" : "REQUESTED";
    const updated = await tx.verificationRequest.update({
      where: { id: request.id },
      data: {
        status: nextStatus,
        verificationLink: null,
        meetUrl: null,
        linkExpiresAt: null
      }
    });

    await tx.user.update({
      where: { id: updated.userId },
      data: {
        videoVerificationStatus: "PENDING",
        onboardingStep: "VIDEO_VERIFICATION_PENDING"
      }
    });

    return updated;
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
    }
  });

  for (const request of expiredMeetLinks) {
    await reopenExpiredMeetLinkIfNeeded(request);
  }

  const waitingCutoff = new Date(now.getTime() - RESPONSE_TIMEOUT_MS);
  const expiredWaitingRequests = await prisma.verificationRequest.findMany({
    where: {
      ...requestScope,
      status: "REQUESTED",
      createdAt: { lte: waitingCutoff }
    }
  });

  for (const request of expiredWaitingRequests) {
    await markTimedOutIfNeeded(request);
  }
}

function mapUserStatus(requestStatus: VerificationRequestStatus) {
  if (requestStatus === "REQUESTED") return "PENDING" as const;
  if (requestStatus === "ASSIGNED") return "ASSIGNED" as const;
  if (requestStatus === "IN_PROGRESS") return "ASSIGNED" as const;
  if (requestStatus === "COMPLETED") return "APPROVED" as const;
  if (requestStatus === "REJECTED") return "REJECTED" as const;
  return "TIMED_OUT" as const;
}

export async function submitVerificationVideo(options: { userId: string; dataUrl: string }) {
  const matches = options.dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches) {
    throw new HttpError(400, { message: "Invalid video payload." });
  }

  const [, mimeType, base64Data] = matches;
  if (!allowedVideoMimeTypes.has(mimeType)) {
    throw new HttpError(400, { message: "Only MP4, WebM, and MOV videos are supported." });
  }

  const size = calculateBase64Size(base64Data);
  if (size > MAX_VIDEO_SIZE_BYTES) {
    throw new HttpError(413, { message: "Video must be 25MB or smaller." });
  }

  const extension = resolveVideoExtension(mimeType);
  const fileName = `${options.userId}-${crypto.randomUUID()}.${extension}`;
  const storagePath = path.join("verification", fileName);
  const buffer = Buffer.from(base64Data, "base64");

  let videoUrl: string;
  if (env.STORAGE_PROVIDER === "local") {
    ensureVerificationUploadsDir();
    const absolutePath = path.join(process.cwd(), "uploads", storagePath);
    await fs.promises.writeFile(absolutePath, buffer);
    videoUrl = `/uploads/${storagePath}`;
  } else {
    throw new HttpError(501, { message: "Remote video storage provider is not configured." });
  }

  const existingActive = await prisma.verificationRequest.findFirst({
    where: { userId: options.userId, status: { in: [...ACTIVE_VERIFICATION_STATUSES] } },
    orderBy: { createdAt: "desc" }
  });

  const request = existingActive
    ? await prisma.verificationRequest.update({
        where: { id: existingActive.id },
        data: {
          status: "REQUESTED",
          reason: null,
          decidedAt: null,
          assignedEmployeeId: null,
          assignedAt: null,
          verificationLink: null,
          meetUrl: null,
          linkExpiresAt: null
        }
      })
    : await prisma.verificationRequest.create({
        data: {
          userId: options.userId,
          status: "REQUESTED"
        }
      });

  await prisma.user.update({
    where: { id: options.userId },
    data: {
      videoUrl,
      isVideoVerified: false,
      videoVerificationStatus: "PENDING",
      onboardingStep: "VIDEO_VERIFICATION_PENDING"
    }
  });

  emitSessionStateChanged([options.userId], "verification_video_uploaded");
  emitVerificationStatusChanged({ userId: options.userId, requestId: request.id, status: request.status });
  emitVerificationQueueChanged(request.id);
  emitAdminDashboardChanged();

  return { request, videoUrl };
}

export async function createVerificationRequest(options: { userId: string }) {
  await synchronizeVerificationRequests({ userId: options.userId });

  const existing = await prisma.verificationRequest.findFirst({
    where: { userId: options.userId, status: { in: [...ACTIVE_VERIFICATION_STATUSES] } },
    orderBy: { createdAt: "desc" }
  });
  if (existing) {
    return existing;
  }

  const latest = await prisma.verificationRequest.findFirst({
    where: { userId: options.userId },
    orderBy: { createdAt: "desc" }
  });
  if (latest && !USER_RETRYABLE_STATUSES.includes(latest.status as (typeof USER_RETRYABLE_STATUSES)[number])) {
    return latest;
  }

  let request;
  try {
    request = await prisma.verificationRequest.create({
      data: { userId: options.userId, status: "REQUESTED" }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existingActive = await prisma.verificationRequest.findFirst({
        where: { userId: options.userId, status: { in: [...ACTIVE_VERIFICATION_STATUSES] } },
        orderBy: { createdAt: "desc" }
      });
      if (existingActive) return markTimedOutIfNeeded(existingActive);
    }
    throw error;
  }
  await prisma.user.update({
    where: { id: options.userId },
    data: {
      isVideoVerified: false,
      videoVerificationStatus: "PENDING",
      onboardingStep: "VIDEO_VERIFICATION_PENDING"
    }
  });
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
    orderBy: { createdAt: "desc" }
  });
  if (!request) {
    return { request: null };
  }

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
      canRetry: true,
      remainingSeconds: RESPONSE_TIMEOUT_MS / 1000,
      whatsappHelpRequestedAt: null,
      requestedAt: null
    };
  }

  const remainingMs =
    request.status === "REQUESTED"
      ? Math.max(0, request.createdAt.getTime() + RESPONSE_TIMEOUT_MS - Date.now())
      : 0;

  return {
    request,
    status: request.status,
    displayStatus: mapUserStatus(request.status),
    meetUrl: request.meetUrl ?? request.verificationLink ?? null,
    canRetry: request.status === "TIMED_OUT",
    remainingSeconds: Math.floor(remainingMs / 1000),
    whatsappHelpRequestedAt: getWhatsAppHelpRequestedAt(request.reason),
    requestedAt: request.createdAt.toISOString()
  };
}

export async function requestWhatsAppVerificationHelp(userId: string) {
  await synchronizeVerificationRequests({ userId });

  const latest = await prisma.verificationRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  if (!latest) {
    throw new HttpError(400, { message: "Please request verification first." });
  }

  const existingHelpRequestedAt = getWhatsAppHelpRequestedAt(latest.reason);
  if (latest.status === "REQUESTED" && existingHelpRequestedAt) {
    return { ok: true, requestedAt: existingHelpRequestedAt };
  }

  if (latest.status === "REQUESTED") {
    throw new HttpError(409, {
      message: "Please wait for an executive to accept your request before escalating to WhatsApp."
    });
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

  const timestamp = new Date().toISOString();
  let targetRequestId = latest.id;

  if (latest.status === "COMPLETED" || latest.status === "REJECTED") {
    throw new HttpError(400, { message: "This verification request is already closed." });
  }

  if (latest.status === "TIMED_OUT") {
    const reopened = await prisma.$transaction(async (tx) => {
      const request = await tx.verificationRequest.create({
        data: {
          userId,
          status: "REQUESTED",
          reason: buildWhatsAppHelpReason(timestamp)
        }
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          videoVerificationStatus: "PENDING",
          onboardingStep: "VIDEO_VERIFICATION_PENDING"
        }
      });

      return request;
    });

    targetRequestId = reopened.id;
  } else if (!existingHelpRequestedAt) {
    await prisma.verificationRequest.update({
      where: { id: latest.id },
      data: {
        reason: buildWhatsAppHelpReason(timestamp)
      }
    });
  }

  const requestedAt = latest.status === "TIMED_OUT" ? timestamp : existingHelpRequestedAt ?? timestamp;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      action: "verification_whatsapp_help_requested",
      targetType: "VerificationRequest",
      targetId: targetRequestId,
      metadata: {
        note: "Manual employee follow-up required. Do not automate responses.",
        requestedAt,
        userPhone: user?.phone ?? null,
        verificationStatus: latest.status
      }
    }
  });
  emitAdminAuditLogsChanged();
  emitOpsCaseActivityChanged({
    caseType: "VERIFICATION",
    caseId: targetRequestId
  });

  emitSessionStateChanged([userId], "verification_help_requested");
  emitVerificationStatusChanged({ userId, requestId: targetRequestId, status: latest.status === "TIMED_OUT" ? "REQUESTED" : latest.status });
  emitVerificationQueueChanged(targetRequestId);
  emitAdminDashboardChanged();

  return { ok: true, requestedAt };
}
