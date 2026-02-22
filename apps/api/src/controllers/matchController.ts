import { Request, Response } from "express";
import { getPhoneUnlock, listMatches, respondConsent } from "../services/matchService";

export async function listMatchesHandler(req: Request, res: Response) {
  const result = await listMatches(req.user!.id);
  return res.json(result);
}

export async function respondConsentHandler(req: Request, res: Response) {
  const { matchId, response } = req.body as { matchId: string; response: "YES" | "NO" };
  const result = await respondConsent({ matchId, userId: req.user!.id, response });
  return res.json(result);
}

export async function phoneUnlockHandler(req: Request, res: Response) {
  const { matchId } = req.params as { matchId: string };
  const result = await getPhoneUnlock({ matchId, userId: req.user!.id });
  return res.json(result);
}
