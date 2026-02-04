import { Request, Response } from "express";
import { listRefunds, requestRefund } from "../services/refundService";

export async function requestRefundHandler(req: Request, res: Response) {
  const { reason } = req.body as { reason?: string | null };
  const result = await requestRefund(res.locals.user, reason ?? null);
  return res.json(result);
}

export async function listRefundsHandler(req: Request, res: Response) {
  const result = await listRefunds(res.locals.user.id);
  return res.json(result);
}
