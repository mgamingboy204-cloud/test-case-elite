import fs from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "../db/prisma";
import { env } from "../config/env";
import { HttpError } from "../utils/httpErrors";

const ACTIVE_VERIFICATION_STATUSES = ["REQUESTED", "IN_PROGRESS"] as const;
const MAX_VIDEO_SIZE_BYTES = 25 * 1024 * 1024;
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

  const request = await prisma.verificationRequest.create({
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
    return existing;
  }
  const request = await prisma.verificationRequest.create({
    data: { userId: options.userId, status: "REQUESTED" }
  });
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
  if (request.status === "IN_PROGRESS" && request.linkExpiresAt && request.linkExpiresAt < new Date()) {
    const updated = await prisma.verificationRequest.update({
      where: { id: request.id },
      data: { status: "REQUESTED", verificationLink: null, meetUrl: null, linkExpiresAt: null }
    });
    return { request: updated };
  }
  return { request };
}
