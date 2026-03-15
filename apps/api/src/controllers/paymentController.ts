import { Request, Response } from "express";
import {
  getLatestPayment,
  initiateOnboardingPayment,
  markOnboardingPaymentFailed,
  verifyOnboardingPayment
} from "../services/paymentService";

export async function getMyPaymentHandler(req: Request, res: Response) {
  const result = await getLatestPayment(res.locals.user.id);
  return res.json({
    payment: result.payment,
    paymentStatus: result.user?.paymentStatus ?? res.locals.user.paymentStatus,
    onboardingStep: result.user?.onboardingStep ?? res.locals.user.onboardingStep,
    plans: result.plans,
    subscription: {
      status: result.user?.subscriptionStatus ?? res.locals.user.subscriptionStatus,
      startedAt: result.user?.subscriptionStartedAt ?? null,
      endsAt: result.user?.subscriptionEndsAt ?? null,
      manualRenewalRequired: true
    },
    pendingPayment: {
      plan: result.user?.onboardingPaymentPlan ?? null,
      amountInr: result.user?.onboardingPaymentAmount ?? null,
      paymentRef: result.user?.onboardingPaymentRef ?? null
    },
    taxIncluded: true,
    renewalPolicy: "MANUAL_ONLY",
    autoRenew: false
  });
}

function normalizeCouponCode(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().toUpperCase();
}

export async function validateCouponHandler(req: Request, res: Response) {
  const code = normalizeCouponCode(req.body?.code);
  if (!code) {
    return res.json({ valid: false, message: "Enter a coupon code." });
  }
  if (code.length > 24) {
    return res.json({ valid: false, message: "Coupon code is too long." });
  }
  if (code.length < 4) {
    return res.json({ valid: false, message: "Coupon code is too short." });
  }
  if (!/^[A-Z0-9]+$/.test(code)) {
    return res.json({ valid: false, message: "Use only letters and numbers." });
  }
  return res.json({
    valid: true,
    code,
    discountType: "PERCENT",
    discountValue: 10,
    message: "10% membership savings applied."
  });
}

export async function initiateOnboardingPaymentHandler(req: Request, res: Response) {
  const { tier, cardLast4 } = req.body as { tier: string; cardLast4: string };
  const result = await initiateOnboardingPayment({ user: res.locals.user, tier, cardLast4 });
  return res.json(result);
}

export async function verifyOnboardingPaymentHandler(req: Request, res: Response) {
  const { paymentRef } = req.body as { paymentRef: string };
  const result = await verifyOnboardingPayment({ user: res.locals.user, paymentRef });
  return res.json(result);
}

export async function markOnboardingPaymentFailedHandler(req: Request, res: Response) {
  const { reason } = req.body as { reason?: string };
  const result = await markOnboardingPaymentFailed({ user: res.locals.user, reason });
  return res.status(402).json(result);
}
