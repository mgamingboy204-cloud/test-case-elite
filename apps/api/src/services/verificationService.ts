import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Prisma, VerificationRequestStatus } from "@prisma/client";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { HttpError } from "../utils/httpErrors";

const ACTIVE_VERIFICATION_STATUSES = ["REQUESTED", "ASSIGNED", "IN_PROGRESS"] as const;
const USER_RETRYABLE_STATUSES = ["REJECTED", "TIMED_OUT"] as const;
const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024;
const RESPONSE_TIMEOUT_MS = 5 * 60 * 1000;
const WHATSAPP_HELP_PREFIX = "WHATSAPP_HELP_REQUESTED:";
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
  if (request.status !== "REQUESTED" && request.status !== "ASSIGNED") return false;
  return request.createdAt.getTime() + RESPONSE_TIMEOUT_MS <= Date.now();
}

type VerificationRequestRecord = Awaited<ReturnType<typeof prisma.verificationRequest.findFirst>>;

async function markTimedOutIfNeeded(request: NonNullable<VerificationRequestRecord>) {
  if (!isRequestExpired(request)) return request;
  return prisma.verificationRequest.update({
    where: { id: request.id },
    data: {
      status: "TIMED_OUT",
      reason: "Timed out without employee response",
      verificationLink: null,
      meetUrl: null,
      linkExpiresAt: null,
      decidedAt: new Date()
    }
  });
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

  return { request, videoUrl };
}

export async function createVerificationRequest(options: { userId: string }) {
  const existing = await prisma.verificationRequest.findFirst({
    where: { userId: options.userId, status: { in: [...ACTIVE_VERIFICATION_STATUSES] } },
    orderBy: { createdAt: "desc" }
  });
  if (existing) {
    return markTimedOutIfNeeded(existing);
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
  return request;
}

export async function getLatestVerificationRequest(userId: string) {
  const request = await prisma.verificationRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });
  if (!request) {
    return { request: null };
  }

  const refreshed = await markTimedOutIfNeeded(request);
  return { request: refreshed };
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

  const remainingMs = Math.max(0, request.createdAt.getTime() + RESPONSE_TIMEOUT_MS - Date.now());

  return {
    request,
    status: request.status,
    displayStatus: mapUserStatus(request.status),
    meetUrl: request.meetUrl ?? request.verificationLink ?? null,
    canRetry: request.status === "TIMED_OUT",
    remainingSeconds: Math.floor(remainingMs / 1000),
    whatsappHelpRequestedAt: request.reason?.startsWith(WHATSAPP_HELP_PREFIX)
      ? request.reason.replace(WHATSAPP_HELP_PREFIX, "")
      : null,
    requestedAt: request.createdAt.toISOString()
  };
}

export async function requestWhatsAppVerificationHelp(userId: string) {
  const latest = await prisma.verificationRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  if (!latest) {
    throw new HttpError(400, { message: "Please request verification first." });
  }

  const timestamp = new Date().toISOString();
  await prisma.verificationRequest.update({
    where: { id: latest.id },
    data: {
      reason: `${WHATSAPP_HELP_PREFIX}${timestamp}`
    }
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      action: "verification_whatsapp_help_requested",
      targetType: "VerificationRequest",
      targetId: latest.id,
      metadata: {
        note: "Manual employee follow-up required. Do not automate responses.",
        requestedAt: timestamp,
        userPhone: user?.phone ?? null,
        verificationStatus: latest.status
      }
    }
  });

  return { ok: true, requestedAt: timestamp };
}
