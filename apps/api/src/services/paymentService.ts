import crypto from "crypto";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

export async function getLatestPayment(userId: string) {
  const payment = await prisma.payment.findFirst({
    where: { userId, status: "PAID" },
    orderBy: { paidAt: "desc" }
  });
  return { payment };
}

export async function initiateOnboardingPayment(options: {
  user: { id: string; videoVerificationStatus: string; onboardingStep: string };
  tier: string;
  cardLast4: string;
}) {
  if (options.user.videoVerificationStatus !== "APPROVED") {
    throw new HttpError(403, {
      message: "Verification required",
      currentStep: options.user.onboardingStep,
      requiredStep: "VIDEO_VERIFIED",
      redirectTo: "/onboarding/verification"
    });
  }

  const paymentRef = `pay_${crypto.randomBytes(8).toString("hex")}`;
  await prisma.user.update({
    where: { id: options.user.id },
    data: {
      onboardingPaymentRef: paymentRef,
      paymentStatus: "PENDING",
      onboardingStep: "PAYMENT_PENDING"
    }
  });

  return {
    ok: true,
    paymentRef,
    gateway: "mock",
    nextAction: "VERIFY",
    tier: options.tier,
    cardLast4: options.cardLast4
  };
}

export async function verifyOnboardingPayment(options: {
  user: { id: string; videoVerificationStatus: string; onboardingPaymentRef: string | null; onboardingStep: string };
  paymentRef: string;
}) {
  if (options.user.videoVerificationStatus !== "APPROVED") {
    throw new HttpError(403, {
      message: "Verification required",
      currentStep: options.user.onboardingStep,
      requiredStep: "VIDEO_VERIFIED",
      redirectTo: "/onboarding/verification"
    });
  }
  if (!options.user.onboardingPaymentRef || options.user.onboardingPaymentRef !== options.paymentRef) {
    throw new HttpError(400, { message: "Invalid payment reference." });
  }

  const payment = await prisma.payment.create({
    data: {
      userId: options.user.id,
      plan: "YEARLY",
      amount: 100000,
      status: "PAID",
      paidAt: new Date()
    }
  });

  const updatedUser = await prisma.user.update({
    where: { id: options.user.id },
    data: {
      paymentStatus: "PAID",
      onboardingStep: "PAID",
      onboardingPaymentVerifiedAt: new Date()
    }
  });

  return { ok: true, payment, paymentStatus: updatedUser.paymentStatus, onboardingStep: updatedUser.onboardingStep };
}
