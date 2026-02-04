import { Payment, User } from "@prisma/client";
import { prisma } from "../db/prisma";
import { env } from "../config/env";

export type RefundEligibility = {
  eligible: boolean;
  reasons: string[];
  eligibleAt: Date;
};

export function computeRefundEligibility(options: {
  user: User;
  payment: Payment | null;
  likesSent: number;
  successfulEngagementCount: number;
  minLikes: number;
  now?: Date;
}): RefundEligibility {
  const { user, payment, likesSent, successfulEngagementCount, minLikes } = options;
  const now = options.now ?? new Date();
  const reasons: string[] = [];

  if (!payment || !payment.paidAt) {
    reasons.push("No payment on file");
  }
  if (user.status !== "APPROVED") {
    reasons.push("User not approved");
  }
  if (!user.verifiedAt) {
    reasons.push("User not verified");
  }

  const paidAt = payment?.paidAt ?? now;
  const eligibleAt = new Date(paidAt.getTime() + 1000 * 60 * 60 * 24 * 90);
  if (now < eligibleAt) {
    reasons.push("Payment is less than 90 days old");
  }

  const inactiveLimit = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 14);
  if (user.lastActiveAt < inactiveLimit) {
    reasons.push("User inactive for more than 14 days");
  }

  if (likesSent < minLikes) {
    reasons.push("Insufficient likes sent");
  }

  if (successfulEngagementCount > 0) {
    reasons.push("Successful engagement exists");
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    eligibleAt
  };
}

export async function requestRefund(user: User, reason?: string | null) {
  const payment = await prisma.payment.findFirst({
    where: { userId: user.id, status: "PAID" },
    orderBy: { paidAt: "desc" }
  });
  const likesSent = await prisma.like.count({
    where: { fromUserId: user.id, type: "LIKE" }
  });
  const successfulEngagementCount = await prisma.phoneExchangeEvent.count({
    where: {
      match: {
        OR: [{ userAId: user.id }, { userBId: user.id }]
      }
    }
  });
  const eligibility = computeRefundEligibility({
    user,
    payment,
    likesSent,
    successfulEngagementCount,
    minLikes: env.MIN_LIKES_FOR_REFUND
  });

  const refund = await prisma.refundRequest.create({
    data: {
      userId: user.id,
      reason: reason ?? null,
      eligibleAt: eligibility.eligibleAt,
      computedEligibilitySnapshot: {
        eligible: eligibility.eligible,
        reasons: eligibility.reasons,
        likesSent,
        successfulEngagementCount,
        minLikes: env.MIN_LIKES_FOR_REFUND
      }
    }
  });
  return { refund, eligibility };
}

export async function listRefunds(userId: string) {
  const refunds = await prisma.refundRequest.findMany({
    where: { userId },
    orderBy: { requestedAt: "desc" }
  });
  return { refunds };
}
