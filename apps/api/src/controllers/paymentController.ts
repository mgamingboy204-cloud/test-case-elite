import { Request, Response } from "express";
import { getLatestPayment } from "../services/paymentService";
import { confirmMockPayment, startMockPayment } from "../services/paymentMockService";

export async function getMyPaymentHandler(req: Request, res: Response) {
  const result = await getLatestPayment(res.locals.user.id);
  return res.json({ payment: result.payment, paymentStatus: res.locals.user.paymentStatus });
}

export async function mockPaymentUnsupported(req: Request, res: Response) {
  return res.status(404).json({ error: "Use /payments/mock/start or /payments/mock/confirm." });
}

export async function startMockPaymentHandler(req: Request, res: Response) {
  const result = await startMockPayment(res.locals.user);
  return res.json(result);
}

export async function confirmMockPaymentHandler(req: Request, res: Response) {
  const result = await confirmMockPayment(res.locals.user);
  return res.json(result);
}
