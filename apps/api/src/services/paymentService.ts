import crypto from "crypto";
import { PaymentPlan } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

const PLAN_DETAILS: Record<PaymentPlan, { amountInr: number; durationMonths: number }> = {
  ONE_MONTH: { amountInr: 30000, durationMonths: 1 },
  FIVE_MONTHS: { amountInr: 70000, durationMonths: 5 },
  TWELVE_MONTHS: { amountInr: 100000, durationMonths: 12 }
};

export function parsePaymentPlan(input: string): PaymentPlan {
  const normalized = input.trim().toUpperCase();
  if (normalized === "ONE_MONTH") return "ONE_MONTH";
  if (normalized === "FIVE_MONTHS") return "FIVE_MONTHS";
  if (normalized === "TWELVE_MONTHS") return "TWELVE_MONTHS";
  throw new HttpError(400, { message: "Unsupported plan. Choose ONE_MONTH, FIVE_MONTHS, or TWELVE_MONTHS." });
}

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

  const plan = parsePaymentPlan(options.tier);
  const planDetails = PLAN_DETAILS[plan];
  const paymentRef = `pay_${crypto.randomBytes(8).toString("hex")}`;

  await prisma.user.update({
    where: { id: options.user.id },
    data: {
      onboardingPaymentRef: paymentRef,
      onboardingPaymentPlan: plan,
      onboardingPaymentAmount: planDetails.amountInr,
      paymentStatus: "PENDING",
      onboardingStep: "PAYMENT_PENDING"
    }
  });

  return {
    ok: true,
    paymentRef,
    gateway: "manual_confirmation",
    nextAction: "VERIFY",
    plan,
    amountInr: planDetails.amountInr,
    durationMonths: planDetails.durationMonths,
    renewalPolicy: "MANUAL_ONLY",
    autoRenew: false,
    cardLast4: options.cardLast4
  };
}

export async function verifyOnboardingPayment(options: {
  user: {
    id: string;
    videoVerificationStatus: string;
    onboardingPaymentRef: string | null;
    onboardingPaymentPlan: PaymentPlan | null;
    onboardingPaymentAmount: number | null;
    onboardingStep: string;
  };
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
  if (!options.user.onboardingPaymentPlan || !options.user.onboardingPaymentAmount) {
    throw new HttpError(400, { message: "Missing payment plan details. Please initiate payment again." });
  }

  const payment = await prisma.payment.create({
    data: {
      userId: options.user.id,
      plan: options.user.onboardingPaymentPlan,
      amount: options.user.onboardingPaymentAmount,
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

  const planDetails = PLAN_DETAILS[payment.plan];

  return {
    ok: true,
    payment,
    paymentStatus: updatedUser.paymentStatus,
    onboardingStep: updatedUser.onboardingStep,
    renewalPolicy: "MANUAL_ONLY",
    autoRenew: false,
    amountInr: payment.amount,
    durationMonths: planDetails.durationMonths
  };
}
