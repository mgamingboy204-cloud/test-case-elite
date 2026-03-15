import { Request, Response } from "express";
import { z } from "zod";
import { completeProfile, getProfile, updateProfile, updateProfileSettings } from "../services/profileService";

const profileSettingsSchema = z
  .object({
    pushNotificationsEnabled: z.boolean().optional(),
    profileVisible: z.boolean().optional(),
    showOnlineStatus: z.boolean().optional(),
    discoverableByPremiumOnly: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one setting is required."
  });

export async function getProfileHandler(req: Request, res: Response) {
  const result = await getProfile(res.locals.user.id);
  return res.json(result);
}

export async function updateProfileHandler(req: Request, res: Response) {
  const result = await updateProfile({
    userId: res.locals.user.id,
    paymentStatus: res.locals.user.paymentStatus,
    onboardingStep: res.locals.user.onboardingStep,
    data: req.body
  });
  return res.json(result);
}

export async function updateProfileSettingsHandler(req: Request, res: Response) {
  const parsed = profileSettingsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid settings update request." });
  }

  const result = await updateProfileSettings(res.locals.user.id, parsed.data);
  return res.json(result);
}

export async function completeProfileHandler(req: Request, res: Response) {
  const result = await completeProfile({
    userId: res.locals.user.id,
    paymentStatus: res.locals.user.paymentStatus,
    onboardingStep: res.locals.user.onboardingStep,
    profileCompletedAt: res.locals.user.profileCompletedAt
  });
  return res.json(result);
}
