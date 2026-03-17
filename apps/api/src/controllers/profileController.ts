import { Request, Response } from "express";
import { z } from "zod";
import { completeProfile, getProfile, updateProfile, updateProfileSettings } from "../services/profileService";

const profileDetailsSchema = z
  .object({
    name: z.string().trim().min(1),
    dateOfBirth: z.coerce.date(),
    gender: z.enum(["MALE", "FEMALE", "NON_BINARY", "OTHER"]),
    city: z.string().trim().min(1),
    heightCm: z.number().int().min(100).max(250).optional().nullable(),
    profession: z.string().trim().min(1).max(120).optional().nullable(),
    bioShort: z.string().trim().max(300).optional().nullable(),
    place: z.string().trim().min(1).optional(),
    bio: z.string().trim().max(300).optional().nullable(),
    intent: z.enum(["dating", "friends", "all"]).optional()
  })
  .superRefine((value, ctx) => {
    const now = new Date();
    let age = now.getUTCFullYear() - value.dateOfBirth.getUTCFullYear();
    const monthDiff = now.getUTCMonth() - value.dateOfBirth.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < value.dateOfBirth.getUTCDate())) age -= 1;
    if (age < 18) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dateOfBirth"], message: "Members must be at least 18 years old." });
    }
  });

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

export async function updateProfileDetailsHandler(req: Request, res: Response) {
  const parsed = profileDetailsSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid profile details.", fieldErrors: parsed.error.flatten().fieldErrors });
  }

  const result = await updateProfile({
    userId: res.locals.user.id,
    paymentStatus: res.locals.user.paymentStatus,
    onboardingStep: res.locals.user.onboardingStep,
    data: parsed.data
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
