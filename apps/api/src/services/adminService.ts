import { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

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
  const [totalUsers, activeUsers, pendingVerification, rejectedVerification] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { onboardingStep: "ACTIVE", deletedAt: null } }),
    prisma.verificationRequest.count({ where: { status: "REQUESTED" } }),
    prisma.verificationRequest.count({ where: { status: "REJECTED" } })
  ]);
  return {
    totalUsers,
    activeUsers,
    pendingVerificationRequests: pendingVerification,
    rejectedVerificationRequests: rejectedVerification
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
    throw new HttpError(404, { error: "User not found" });
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
    await tx.like.deleteMany({ where: { OR: [{ fromUserId: userId }, { toUserId: userId }] } });
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

export async function listVerificationRequests(statusFilter?: string): Promise<{ requests: VerificationRequestListItem[] }> {
  const requests: VerificationRequestListItem[] = await prisma.verificationRequest.findMany({
    where: statusFilter && statusFilter !== "ALL" ? { status: statusFilter as any } : {},
    include: { user: { select: { id: true, phone: true, email: true } } },
    orderBy: { createdAt: "desc" }
  });
  return { requests };
}

export async function startVerificationRequest(requestId: string, meetUrl: string, actorUserId: string) {
  const now = new Date();
  const request = await prisma.verificationRequest.update({
    where: { id: requestId },
    data: {
      status: "IN_PROGRESS",
      verificationLink: meetUrl,
      meetUrl,
      linkExpiresAt: new Date(now.getTime() + 10 * 60 * 1000)
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
  await prisma.notification.upsert({
    where: {
      userId_type_actorUserId_matchId: {
        userId: request.userId,
        type: "VIDEO_VERIFICATION_UPDATE",
        actorUserId,
        matchId: null
      }
    },
    update: {
      metadata: { meetUrl, cta: "Join verification call" },
      createdAt: now,
      isRead: false
    },
    create: {
      userId: request.userId,
      actorUserId,
      type: "VIDEO_VERIFICATION_UPDATE",
      metadata: { meetUrl, cta: "Join verification call" }
    }
  });
  return { request };
}

export async function approveVerificationRequest(requestId: string, actorUserId: string) {
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
      onboardingStep: "VIDEO_VERIFIED"
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
  return { request };
}

export async function rejectVerificationRequest(requestId: string, actorUserId: string, reason: string) {
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
      reason: reason.trim()
    }

  });
  await prisma.user.update({
    where: { id: request.userId },
    data: {
      status: "REJECTED",
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
      metadata: { reason: reason.trim() }
    }
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
      meetUrl,
      verificationLink: meetUrl,
      linkExpiresAt: new Date(now.getTime() + 10 * 60 * 1000)
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
  await prisma.notification.upsert({
    where: {
      userId_type_actorUserId_matchId: {
        userId,
        type: "VIDEO_VERIFICATION_UPDATE",
        actorUserId,
        matchId: null
      }
    },
    update: {
      metadata: { meetUrl, cta: "Join verification call" },
      createdAt: now,
      isRead: false
    },
    create: {
      userId,
      actorUserId,
      type: "VIDEO_VERIFICATION_UPDATE",
      metadata: { meetUrl, cta: "Join verification call" }
    }
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
      onboardingStep: "VIDEO_VERIFIED"
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
  return { request: updated };
}

export async function rejectVerificationForUser(userId: string, actorUserId: string, reason: string) {
  const request = await findOrCreateVerificationRequest(userId);
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
      reason: reason.trim()
    }

  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      status: "REJECTED",
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
      metadata: { reason: reason.trim() }
    }
  });
  return { request: updated };
}

export async function shiftPaymentDate(options: { userId: string; daysBack: number }) {
  const payment = await prisma.payment.findFirst({
    where: { userId: options.userId, status: "PAID" },
    orderBy: { paidAt: "desc" }
  });
  if (!payment?.paidAt) {
    throw new HttpError(404, { error: "Payment not found" });
  }
  const shifted = new Date(payment.paidAt.getTime() - options.daysBack * 24 * 60 * 60 * 1000);
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: { paidAt: shifted }
  });
  return updated;
}
