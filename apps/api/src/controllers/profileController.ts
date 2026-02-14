import { Request, Response } from "express";
import {
  ProfileCompleteResponseSchema,
  ProfileReadResponseSchema,
  ProfileUpdateResponseSchema
} from "@elite/contracts";
import { completeProfile, getProfile, updateProfile } from "../services/profileService";
import { sendContract } from "../utils/contractResponse";

export async function getProfileHandler(req: Request, res: Response) {
  const { profile, photos, user } = await getProfile(res.locals.user.id);
  return sendContract(res, ProfileReadResponseSchema, { profile, photos, user });
}

export async function updateProfileHandler(req: Request, res: Response) {
  const result = await updateProfile({
    userId: res.locals.user.id,
    paymentStatus: res.locals.user.paymentStatus,
    onboardingStep: res.locals.user.onboardingStep,
    data: req.body
  });
  return sendContract(res, ProfileUpdateResponseSchema, result);
}

export async function completeProfileHandler(req: Request, res: Response) {
  const result = await completeProfile({
    userId: res.locals.user.id,
    paymentStatus: res.locals.user.paymentStatus,
    onboardingStep: res.locals.user.onboardingStep,
    profileCompletedAt: res.locals.user.profileCompletedAt
  });
  return sendContract(res, ProfileCompleteResponseSchema, result);
}
