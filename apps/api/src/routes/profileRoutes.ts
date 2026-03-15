import { Router } from "express";
import { ProfilePatchSchema, ProfileSchema } from "@vael/shared";
import {
  completeProfileHandler,
  getProfileHandler,
  updateProfileHandler,
  updateProfileSettingsHandler
} from "../controllers/profileController";
import { requireAuth, requireAuthHeader, requireOnboardingTokenMatch } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/profile", requireAuth, asyncHandler(getProfileHandler));
router.put(
  "/profile",
  requireAuth,
  requireAuthHeader,
  requireOnboardingTokenMatch,
  validateBody(ProfileSchema),
  asyncHandler(updateProfileHandler)
);
router.patch(
  "/profile",
  requireAuth,
  requireAuthHeader,
  requireOnboardingTokenMatch,
  validateBody(ProfilePatchSchema),
  asyncHandler(updateProfileHandler)
);
router.patch(
  "/profile/settings",
  requireAuth,
  requireAuthHeader,
  requireOnboardingTokenMatch,
  asyncHandler(updateProfileSettingsHandler)
);
router.post("/profile/complete", requireAuth, requireAuthHeader, requireOnboardingTokenMatch, asyncHandler(completeProfileHandler));

export default router;
