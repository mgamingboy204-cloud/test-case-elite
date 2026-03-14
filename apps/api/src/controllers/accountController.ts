import { Request, Response } from "express";
import { deleteOwnAccount, getAccountPreferences, updateAccountPreferences } from "../services/accountService";

export async function getAccountPreferencesHandler(req: Request, res: Response) {
  const preferences = await getAccountPreferences(res.locals.user.id);
  return res.json({ preferences });
}

export async function updateAccountPreferencesHandler(req: Request, res: Response) {
  const preferences = await updateAccountPreferences(res.locals.user.id, req.body ?? {});
  return res.json({ preferences });
}

export async function deleteOwnAccountHandler(req: Request, res: Response) {
  const result = await deleteOwnAccount(res.locals.user.id);
  return res.json(result);
}
