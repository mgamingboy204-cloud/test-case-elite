import { Request, Response } from "express";
import { getConsentUnlock, getPhoneUnlock, listMatches, respondConsent } from "../services/matchService";

export async function listMatchesHandler(req: Request, res: Response) {
  const result = await listMatches(req.user!.id);
  return res.json(result);
}

export async function respondConsentHandler(req: Request, res: Response) {
  const { matchId, response, type, payload } = req.body as {
    matchId: string;
    response: "YES" | "NO";
    type?: "PHONE_NUMBER" | "OFFLINE_MEET" | "ONLINE_MEET" | "SOCIAL_EXCHANGE";
    payload?: Record<string, unknown> | null;
  };
  const result = await respondConsent({ matchId, userId: req.user!.id, response, type, payload });
  return res.json(result);
}

export async function phoneUnlockHandler(req: Request, res: Response) {
  const { matchId } = req.params as { matchId: string };
  const result = await getPhoneUnlock({ matchId, userId: req.user!.id });
  return res.json(result);
}

export async function offlineMeetUnlockHandler(req: Request, res: Response) {
  const { matchId } = req.params as { matchId: string };
  const result = await getConsentUnlock({ matchId, userId: req.user!.id, type: "OFFLINE_MEET" });
  return res.json(result);
}

export async function onlineMeetUnlockHandler(req: Request, res: Response) {
  const { matchId } = req.params as { matchId: string };
  const result = await getConsentUnlock({ matchId, userId: req.user!.id, type: "ONLINE_MEET" });
  return res.json(result);
}

export async function socialExchangeUnlockHandler(req: Request, res: Response) {
  const { matchId } = req.params as { matchId: string };
  const result = await getConsentUnlock({ matchId, userId: req.user!.id, type: "SOCIAL_EXCHANGE" });
  return res.json(result);
}
