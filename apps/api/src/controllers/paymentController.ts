import { Request, Response } from "express";
import { getLatestPayment } from "../services/paymentService";
import { confirmMockPayment, startMockPayment } from "../services/paymentMockService";

export async function getMyPaymentHandler(req: Request, res: Response) {
  const result = await getLatestPayment(res.locals.user.id);
  return res.json({ payment: result.payment, paymentStatus: res.locals.user.paymentStatus });
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

export async function mockPaymentUnsupported(req: Request, res: Response) {
  return res.status(404).json({ error: "Use /payments/mock/start or /payments/mock/confirm." });
}

export async function startMockPaymentHandler(req: Request, res: Response) {
  const couponCode = typeof req.body?.couponCode === "string" ? req.body.couponCode : null;
  const result = await startMockPayment(res.locals.user, couponCode);
  return res.json(result);
}

export async function confirmMockPaymentHandler(req: Request, res: Response) {
  const result = await confirmMockPayment(res.locals.user);
  return res.json(result);
}
