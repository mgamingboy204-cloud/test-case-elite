import { prisma } from "../db/prisma";

const ACTIVE_VERIFICATION_STATUSES = ["REQUESTED", "IN_PROGRESS"] as const;

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
      data: { status: "REQUESTED", verificationLink: null, linkExpiresAt: null }
    });
    return { request: updated };
  }
  return { request };
}
