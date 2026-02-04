import { Request, Response } from "express";
import { createVerificationRequest, getLatestVerificationRequest } from "../services/verificationService";

export async function createVerificationRequestHandler(req: Request, res: Response) {
  const request = await createVerificationRequest({ userId: res.locals.user.id });
  return res.json({ request });
}

export async function getMyVerificationRequestHandler(req: Request, res: Response) {
  const result = await getLatestVerificationRequest(res.locals.user.id);
  return res.json(result);
}

export async function getVerificationStatusHandler(req: Request, res: Response) {
  const result = await getLatestVerificationRequest(res.locals.user.id);
  if (result.request?.status === "IN_PROGRESS" && result.request.linkExpiresAt) {
    const isExpired = result.request.linkExpiresAt.getTime() < Date.now();
    if (isExpired) {
      return res.json({ request: { ...result.request, verificationLink: null, linkExpiresAt: null } });
    }
  }
  return res.json(result);
}
