import { Router } from "express";
import { ProfilePatchSchema, ProfileSchema } from "@vael/shared";
import {
  completeProfileHandler,
  getProfileHandler,
  updateProfileHandler,
  updateProfileSettingsHandler
} from "../controllers/profileController";
import { requireAuth, requireOnboardingTokenMatch } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/profile", requireAuth, asyncHandler(getProfileHandler));
router.put(
  "/profile",
  requireAuth,
  requireOnboardingTokenMatch,
  validateBody(ProfileSchema),
  asyncHandler(updateProfileHandler)
);
router.patch(
  "/profile",
  requireAuth,
  requireOnboardingTokenMatch,
  validateBody(ProfilePatchSchema),
  asyncHandler(updateProfileHandler)
);
router.patch(
  "/profile/settings",
  requireAuth,
  requireOnboardingTokenMatch,
  asyncHandler(updateProfileSettingsHandler)
);
router.post("/profile/complete", requireAuth, requireOnboardingTokenMatch, asyncHandler(completeProfileHandler));

export default router;
