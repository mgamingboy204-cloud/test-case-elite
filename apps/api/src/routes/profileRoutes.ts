import { z } from "zod";
import { Router } from "express";
import { ProfilePatchSchema, ProfileSchema } from "@vael/shared";
import {
  completeProfileHandler,
  getProfileHandler,
  updateProfileDetailsHandler,
  updateProfileHandler,
  updateProfileSettingsHandler
} from "../controllers/profileController";
import { requireAuth, requireOnboardingTokenMatch } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { confirmPhotoUploadHandler, requestPhotoUploadUrlHandler } from "../controllers/photoController";

const router = Router();

router.get("/profile", requireAuth, asyncHandler(getProfileHandler));
router.post("/profile/details", requireAuth, requireOnboardingTokenMatch, asyncHandler(updateProfileDetailsHandler));
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
router.post(
  "/profile/photos/presigned-url",
  requireAuth,
  requireOnboardingTokenMatch,
  validateBody(
    z.object({
      filename: z.string().min(1),
      mimeType: z.string().min(1)
    })
  ),
  asyncHandler(requestPhotoUploadUrlHandler)
);
router.post(
  "/profile/photos/confirm",
  requireAuth,
  requireOnboardingTokenMatch,
  validateBody(
    z.object({
      uploadToken: z.string().min(1),
      filename: z.string().min(1),
      dataUrl: z.string().min(10),
      cropX: z.number().optional(),
      cropY: z.number().optional(),
      cropZoom: z.number().optional()
    })
  ),
  asyncHandler(confirmPhotoUploadHandler)
);

router.post("/profile/complete", requireAuth, requireOnboardingTokenMatch, asyncHandler(completeProfileHandler));

export default router;
