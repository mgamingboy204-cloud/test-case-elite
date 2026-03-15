import { PaymentPlan } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";
import { env } from "../config/env";
import { getPaymentProviderMode, initiatePaymentGatewayOrder, verifyPaymentGatewaySignature } from "./paymentGatewayService";

const PLAN_DETAILS: Record<PaymentPlan, { amountInr: number; durationMonths: number; label: string }> = {
  ONE_MONTH: { amountInr: 30000, durationMonths: 1, label: "1 month" },
  FIVE_MONTHS: { amountInr: 70000, durationMonths: 5, label: "5 months" },
  TWELVE_MONTHS: { amountInr: 100000, durationMonths: 12, label: "12 months" }
};

function addMonths(baseDate: Date, months: number) {
  const date = new Date(baseDate);
  date.setMonth(date.getMonth() + months);
  return date;
}

function hasActiveSubscription(subscriptionEndsAt: Date | null | undefined) {
  return Boolean(subscriptionEndsAt && subscriptionEndsAt.getTime() > Date.now());
}

export function parsePaymentPlan(input: string): PaymentPlan {
  const normalized = input.trim().toUpperCase();
  if (normalized === "ONE_MONTH") return "ONE_MONTH";
  if (normalized === "FIVE_MONTHS") return "FIVE_MONTHS";
  if (normalized === "TWELVE_MONTHS") return "TWELVE_MONTHS";
  throw new HttpError(400, { message: "Unsupported plan. Choose ONE_MONTH, FIVE_MONTHS, or TWELVE_MONTHS." });
}

export function getPlanCatalog() {
  return Object.entries(PLAN_DETAILS).map(([plan, value]) => ({
    plan,
    amountInr: value.amountInr,
    durationMonths: value.durationMonths,
    taxIncluded: true,
    autoRenew: false,
    renewalPolicy: "MANUAL_ONLY"
  }));
}

export async function getLatestPayment(userId: string) {
  const [payment, user] = await Promise.all([
    prisma.payment.findFirst({
      where: { userId },
      orderBy: { paidAt: "desc" }
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        paymentStatus: true,
        onboardingStep: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionEndsAt: true,
        onboardingPaymentPlan: true,
        onboardingPaymentAmount: true,
        onboardingPaymentRef: true
      }
    })
  ]);

  return {
    payment,
    user,
    plans: getPlanCatalog()
  };
}

export async function initiateOnboardingPayment(options: {
  user: {
    id: string;
    videoVerificationStatus: string;
    onboardingStep: string;
    subscriptionEndsAt: Date | null;
    paymentStatus: string;
  };
  tier: string;
}) {
  if (options.user.videoVerificationStatus !== "APPROVED") {
    throw new HttpError(403, {
      message: "Verification required",
      currentStep: options.user.onboardingStep,
      requiredStep: "VIDEO_VERIFIED",
      redirectTo: "/onboarding/verification"
    });
  }

  if (hasActiveSubscription(options.user.subscriptionEndsAt)) {
    throw new HttpError(409, {
      message: "Your current membership is active. You can renew manually after expiry."
    });
  }

  const plan = parsePaymentPlan(options.tier);
  const planDetails = PLAN_DETAILS[plan];
  const receipt = `rcpt_${options.user.id.slice(0, 8)}_${Date.now()}`;
  const gatewayOrder = await initiatePaymentGatewayOrder({ amountInr: planDetails.amountInr, receipt });
  const paymentRef = gatewayOrder.paymentRef;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: options.user.id },
      data: {
        onboardingPaymentRef: paymentRef,
        onboardingPaymentPlan: plan,
        onboardingPaymentAmount: planDetails.amountInr,
        paymentStatus: "PENDING",
        onboardingStep: "PAYMENT_PENDING"
      }
    });

    await tx.payment.create({
      data: {
        userId: options.user.id,
        plan,
        amount: planDetails.amountInr,
        status: "PENDING"
      }
    });
  });

  return {
    ok: true,
    paymentRef,
    gateway: gatewayOrder.gateway,
    nextAction: gatewayOrder.nextAction,
    ...(gatewayOrder.gateway === "razorpay"
      ? {
          razorpay: gatewayOrder.razorpay
        }
      : {
          mock: gatewayOrder.mock
        }),
    plan,
    amountInr: planDetails.amountInr,
    durationMonths: planDetails.durationMonths,
    taxIncluded: true,
    renewalPolicy: "MANUAL_ONLY",
    autoRenew: false
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
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  if (options.user.videoVerificationStatus !== "APPROVED") {
    throw new HttpError(403, {
      message: "Verification required",
      currentStep: options.user.onboardingStep,
      requiredStep: "VIDEO_VERIFIED",
      redirectTo: "/onboarding/verification"
    });
  }
  if (!options.user.onboardingPaymentRef || options.user.onboardingPaymentRef !== options.orderId) {
    throw new HttpError(400, { message: "Invalid payment reference." });
  }
  if (!options.user.onboardingPaymentPlan || !options.user.onboardingPaymentAmount) {
    throw new HttpError(400, { message: "Missing payment plan details. Please initiate payment again." });
  }

  const existingPaidUser = await prisma.user.findUnique({
    where: { id: options.user.id },
    select: {
      paymentStatus: true,
      onboardingPaymentRef: true,
      onboardingPaymentVerifiedAt: true,
      subscriptionStartedAt: true,
      subscriptionEndsAt: true
    }
  });

  if (
    existingPaidUser?.paymentStatus === "PAID" &&
    existingPaidUser.onboardingPaymentRef === options.orderId &&
    existingPaidUser.onboardingPaymentVerifiedAt
  ) {
    const latestPaid = await prisma.payment.findFirst({
      where: { userId: options.user.id, status: "PAID" },
      orderBy: { paidAt: "desc" }
    });

    return {
      ok: true,
      payment: latestPaid,
      paymentStatus: "PAID",
      onboardingStep: "PAID",
      renewalPolicy: "MANUAL_ONLY",
      autoRenew: false,
      taxIncluded: true,
      amountInr: options.user.onboardingPaymentAmount,
      durationMonths: PLAN_DETAILS[options.user.onboardingPaymentPlan].durationMonths,
      subscriptionStartedAt: existingPaidUser.subscriptionStartedAt,
      subscriptionEndsAt: existingPaidUser.subscriptionEndsAt
    };
  }

  verifyPaymentGatewaySignature({ orderId: options.orderId, paymentId: options.paymentId, signature: options.signature });

  const selectedPlan = options.user.onboardingPaymentPlan;
  const selectedAmount = options.user.onboardingPaymentAmount;

  const startedAt = new Date();
  const planDetails = PLAN_DETAILS[selectedPlan];
  const endsAt = addMonths(startedAt, planDetails.durationMonths);

  const payment = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.updateMany({
      where: {
        userId: options.user.id,
        status: "PENDING",
        plan: selectedPlan,
        amount: selectedAmount
      },
      data: {
        status: "PAID",
        paidAt: startedAt
      }
    });

    if (updated.count === 0) {
      await tx.payment.create({
        data: {
          userId: options.user.id,
          plan: selectedPlan,
          amount: selectedAmount,
          status: "PAID",
          paidAt: startedAt
        }
      });
    }

    const latestPaid = await tx.payment.findFirst({
      where: { userId: options.user.id, status: "PAID" },
      orderBy: { paidAt: "desc" }
    });

    await tx.user.update({
      where: { id: options.user.id },
      data: {
        paymentStatus: "PAID",
        onboardingStep: "PAID",
        onboardingPaymentVerifiedAt: startedAt,
        subscriptionTier: "PREMIUM",
        subscriptionStatus: "ACTIVE",
        subscriptionStartedAt: startedAt,
        subscriptionEndsAt: endsAt,
        manualRenewalRequired: true
      }
    });

    return latestPaid;
  });

  return {
    ok: true,
    payment,
    paymentStatus: "PAID",
    onboardingStep: "PAID",
    renewalPolicy: "MANUAL_ONLY",
    autoRenew: false,
    taxIncluded: true,
    amountInr: selectedAmount,
    durationMonths: planDetails.durationMonths,
    subscriptionStartedAt: startedAt,
    subscriptionEndsAt: endsAt
  };
}

export async function completeMockOnboardingPayment(options: {
  user: {
    id: string;
    videoVerificationStatus: string;
    onboardingPaymentPlan: PaymentPlan | null;
    onboardingPaymentAmount: number | null;
    onboardingStep: string;
  };
}) {
  if (getPaymentProviderMode() !== "mock" && !env.ALLOW_TEST_BYPASS) {
    throw new HttpError(404, { message: "Not found" });
  }
  if (!options.user.onboardingPaymentPlan || !options.user.onboardingPaymentAmount) {
    throw new HttpError(400, { message: "Missing payment plan details. Please initiate payment again." });
  }
  const selectedPlan = options.user.onboardingPaymentPlan;
  const selectedAmount = options.user.onboardingPaymentAmount;
  const startedAt = new Date();
  const planDetails = PLAN_DETAILS[selectedPlan];
  const endsAt = addMonths(startedAt, planDetails.durationMonths);

  const payment = await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { userId: options.user.id, status: "PENDING", plan: selectedPlan, amount: selectedAmount },
      data: { status: "MOCK", paidAt: startedAt }
    });
    await tx.user.update({
      where: { id: options.user.id },
      data: {
        paymentStatus: "PAID",
        onboardingStep: "PAID",
        onboardingPaymentVerifiedAt: startedAt,
        subscriptionTier: "PREMIUM",
        subscriptionStatus: "ACTIVE",
        subscriptionStartedAt: startedAt,
        subscriptionEndsAt: endsAt,
        manualRenewalRequired: true
      }
    });
    return tx.payment.findFirst({ where: { userId: options.user.id }, orderBy: { paidAt: "desc" } });
  });
  return { ok: true, mocked: true, payment, paymentStatus: "PAID", onboardingStep: "PAID" };
}

export async function markOnboardingPaymentFailed(options: {
  user: {
    id: string;
    onboardingPaymentPlan: PaymentPlan | null;
    onboardingPaymentAmount: number | null;
  };
  reason?: string;
}) {
  if (!options.user.onboardingPaymentPlan || !options.user.onboardingPaymentAmount) {
    throw new HttpError(400, { message: "No pending payment session found." });
  }

  const selectedPlan = options.user.onboardingPaymentPlan;
  const selectedAmount = options.user.onboardingPaymentAmount;

  await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: {
        userId: options.user.id,
        status: "PENDING",
        plan: selectedPlan,
        amount: selectedAmount
      },
      data: {
        status: "FAILED"
      }
    });

    await tx.user.update({
      where: { id: options.user.id },
      data: {
        paymentStatus: "FAILED",
        onboardingStep: "PAYMENT_PENDING"
      }
    });

    const existingPaymentIssueNotification = await tx.notification.findFirst({
      where: {
        userId: options.user.id,
        type: "SYSTEM_PROMO",
        deepLinkUrl: "/onboarding/payment"
      },
      orderBy: { createdAt: "desc" }
    });

    if (existingPaymentIssueNotification) {
      await tx.notification.update({
        where: { id: existingPaymentIssueNotification.id },
        data: {
          title: "Payment Action Required",
          message: "Your membership payment did not complete. Please retry or contact premium support.",
          metadata: { eventType: "PAYMENT_ISSUE" },
          deepLinkUrl: "/onboarding/payment",
          isRead: false,
          readAt: null,
          createdAt: new Date()
        }
      });
    } else {
      await tx.notification.create({
        data: {
          userId: options.user.id,
          type: "SYSTEM_PROMO",
          title: "Payment Action Required",
          message: "Your membership payment did not complete. Please retry or contact premium support.",
          metadata: { eventType: "PAYMENT_ISSUE" },
          deepLinkUrl: "/onboarding/payment"
        }
      });
    }
  });

  return {
    ok: false,
    paymentStatus: "FAILED",
    message:
      options.reason?.trim() ||
      "Payment could not be completed. Please contact premium support on WhatsApp and expect a response within 1 to 2 hours."
  };
}
