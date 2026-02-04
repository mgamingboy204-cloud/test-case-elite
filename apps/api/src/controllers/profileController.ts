import { Request, Response } from "express";
import { completeProfile, getProfile, updateProfile } from "../services/profileService";

export async function getProfileHandler(req: Request, res: Response) {
  const { profile, photos } = await getProfile(res.locals.user.id);
  return res.json({ profile, photos });
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

export async function completeProfileHandler(req: Request, res: Response) {
  const result = await completeProfile({
    userId: res.locals.user.id,
    paymentStatus: res.locals.user.paymentStatus,
    onboardingStep: res.locals.user.onboardingStep,
    profileCompletedAt: res.locals.user.profileCompletedAt
  });
  return res.json(result);
}
