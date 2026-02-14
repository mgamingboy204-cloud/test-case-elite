import { Request, Response } from "express";
import {
  VerificationRequestEnvelopeSchema,
  VerificationStatusSchema
} from "@elite/contracts";
import { createVerificationRequest, getLatestVerificationRequest } from "../services/verificationService";
import { sendContract } from "../utils/contractResponse";

export async function createVerificationRequestHandler(req: Request, res: Response) {
  const request = await createVerificationRequest({ userId: res.locals.user.id });
  return sendContract(res, VerificationRequestEnvelopeSchema, { request });
}

export async function getMyVerificationRequestHandler(req: Request, res: Response) {
  const result = await getLatestVerificationRequest(res.locals.user.id);
  return sendContract(res, VerificationRequestEnvelopeSchema, result);
}

export async function getVerificationStatusHandler(req: Request, res: Response) {
  const result = await getLatestVerificationRequest(res.locals.user.id);
  if (result.request?.status === "IN_PROGRESS" && result.request.linkExpiresAt) {
    const isExpired = result.request.linkExpiresAt.getTime() < Date.now();
    if (isExpired) {
      return sendContract(res, VerificationRequestEnvelopeSchema, { request: { ...result.request, meetUrl: null, verificationLink: null, linkExpiresAt: null } });
    }
  }
  return sendContract(res, VerificationRequestEnvelopeSchema, result);
}

export async function getMyVerificationStatusHandler(req: Request, res: Response) {
  const result = await getLatestVerificationRequest(res.locals.user.id);
  if (!result.request) {
    return sendContract(res, VerificationStatusSchema, { status: "NOT_REQUESTED", meetUrl: null });
  }
  const meetUrl =
    result.request.status === "IN_PROGRESS" && result.request.linkExpiresAt && result.request.linkExpiresAt.getTime() < Date.now()
      ? null
      : result.request.meetUrl ?? result.request.verificationLink ?? null;
  return sendContract(res, VerificationStatusSchema, { status: result.request.status, meetUrl });
}
