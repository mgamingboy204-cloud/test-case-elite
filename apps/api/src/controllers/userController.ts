import { Request, Response } from "express";
import { z } from "zod";
import { deactivateAccount } from "../services/userService";

const deleteAccountSchema = z.object({
  confirmation: z.literal("DELETE_MY_ACCOUNT"),
  reason: z.string().trim().max(240).optional()
});

export async function deleteMyAccountHandler(req: Request, res: Response) {
  const parsed = deleteAccountSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Please confirm account deletion to continue." });
  }

  const result = await deactivateAccount({
    userId: res.locals.user.id,
    reason: parsed.data.reason
  });

  return res.json(result);
}
