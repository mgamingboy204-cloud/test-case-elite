import { Request, Response } from "express";
import {
  createVerificationRequest,
  getLatestVerificationRequest,
  getVerificationStatusPayload,
  requestWhatsAppVerificationHelp,
  submitVerificationVideo
} from "../services/verificationService";

export async function createVerificationRequestHandler(req: Request, res: Response) {
  const request = await createVerificationRequest({ userId: res.locals.user.id });
  return res.json({ request });
}

export async function uploadVerificationVideoHandler(req: Request, res: Response) {
  const { videoDataUrl } = req.body as { videoDataUrl: string };
  const result = await submitVerificationVideo({ userId: res.locals.user.id, dataUrl: videoDataUrl });
  return res.json({ ok: true, request: result.request, videoUrl: result.videoUrl });
}

export async function getMyVerificationRequestHandler(req: Request, res: Response) {
  const result = await getLatestVerificationRequest(res.locals.user.id);
  return res.json(result);
}

export async function getVerificationStatusHandler(req: Request, res: Response) {
  const result = await getVerificationStatusPayload(res.locals.user.id);
  return res.json(result);
}

export async function getMyVerificationStatusHandler(req: Request, res: Response) {
  const result = await getVerificationStatusPayload(res.locals.user.id);
  return res.json({ status: result.displayStatus, meetUrl: result.meetUrl, canRetry: result.canRetry });
}

export async function requestVerificationWhatsAppHelpHandler(req: Request, res: Response) {
  const result = await requestWhatsAppVerificationHelp(res.locals.user.id);
  return res.json(result);
}
