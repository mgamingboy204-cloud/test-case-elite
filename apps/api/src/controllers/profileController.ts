import { Request, Response } from "express";
import { completeProfile, getProfile, updateProfile, updateProfileSettings } from "../services/profileService";

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
  const result = await updateProfileSettings(res.locals.user.id, req.body);
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
