import { Request, Response } from "express";
import { updateProfileSettings } from "../services/profileService";

export async function updateNotificationsEnabledHandler(req: Request, res: Response) {
  const enabled = Boolean((req.body as { enabled?: boolean } | undefined)?.enabled);
  const result = await updateProfileSettings(res.locals.user.id, { pushNotificationsEnabled: enabled });
  return res.json({ updated: true, settings: result.settings });
}

