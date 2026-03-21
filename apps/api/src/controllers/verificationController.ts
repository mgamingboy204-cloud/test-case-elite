import { Request, Response } from "express";
import {
  createVerificationRequest,
  getVerificationStatusPayload,
  requestWhatsAppVerificationHelp
} from "../services/verificationService";

export async function createVerificationRequestHandler(req: Request, res: Response) {
  const request = await createVerificationRequest({ userId: res.locals.user.id });
  return res.json({ request });
}

export async function getVerificationStatusHandler(req: Request, res: Response) {
  const result = await getVerificationStatusPayload(res.locals.user.id);
  return res.json(result);
}

export async function requestVerificationWhatsAppHelpHandler(req: Request, res: Response) {
  const result = await requestWhatsAppVerificationHelp(res.locals.user.id);
  return res.json(result);
}
