import { Request, Response } from "express";
import {
  createSocialExchangeRequest,
  listSocialExchangeCases,
  openSocialReveal,
  respondToSocialExchangeRequest,
  submitSocialHandle
} from "../services/socialExchangeService";

export async function createSocialExchangeRequestHandler(req: Request, res: Response) {
  const { matchId } = req.params as { matchId: string };
  const result = await createSocialExchangeRequest({ matchId, userId: req.user!.id });
  return res.json(result);
}

export async function listSocialExchangeCasesHandler(req: Request, res: Response) {
  const { matchId } = req.params as { matchId: string };
  const result = await listSocialExchangeCases({ matchId, userId: req.user!.id });
  return res.json(result);
}

export async function respondToSocialExchangeRequestHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const { response } = req.body as { response: "ACCEPT" | "REJECT" };
  const result = await respondToSocialExchangeRequest({ caseId, userId: req.user!.id, response });
  return res.json(result);
}

export async function submitSocialHandleHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const { platform, handle } = req.body as { platform: string; handle: string };
  const result = await submitSocialHandle({ caseId, userId: req.user!.id, platform, handle });
  return res.json(result);
}

export async function openSocialRevealHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const result = await openSocialReveal({ caseId, userId: req.user!.id });
  return res.json(result);
}
