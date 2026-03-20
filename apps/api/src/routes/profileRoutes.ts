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
import {
  confirmPhotoUploadHandler,
  deletePhotoHandler,
  listPhotosHandler,
  requestPhotoUploadUrlHandler
} from "../controllers/photoController";
import { updateProfile } from "../services/profileService";

const router = Router();

function registerProfileRoutes(basePath: "/me/profile") {
  router.get(basePath, requireAuth, asyncHandler(getProfileHandler));
  router.post(`${basePath}/details`, requireAuth, requireOnboardingTokenMatch, asyncHandler(updateProfileDetailsHandler));
  router.put(
    basePath,
    requireAuth,
    requireOnboardingTokenMatch,
    validateBody(ProfileSchema),
    asyncHandler(updateProfileHandler)
  );
  router.patch(
    basePath,
    requireAuth,
    requireOnboardingTokenMatch,
    validateBody(ProfilePatchSchema),
    asyncHandler(updateProfileHandler)
  );
  router.patch(
    `${basePath}/settings`,
    requireAuth,
    requireOnboardingTokenMatch,
    asyncHandler(updateProfileSettingsHandler)
  );
  router.post(
    `${basePath}/photos/presigned-url`,
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
    `${basePath}/photos/confirm`,
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
  router.post(`${basePath}/complete`, requireAuth, requireOnboardingTokenMatch, asyncHandler(completeProfileHandler));
}

registerProfileRoutes("/me/profile");

router.get("/me/profile/photos", requireAuth, asyncHandler(listPhotosHandler));
router.delete("/me/profile/photos/:photoId", requireAuth, requireOnboardingTokenMatch, asyncHandler(deletePhotoHandler));
router.patch(
  "/me/profile/photos/reorder",
  requireAuth,
  requireOnboardingTokenMatch,
  validateBody(
    z.object({
      photos: z.array(
        z.object({
          photoId: z.string().uuid(),
          photoIndex: z.number().int().min(0)
        })
      ).min(1)
    })
  ),
  asyncHandler(async (req, res) => {
    const { photos } = req.body as { photos: Array<{ photoId: string; photoIndex: number }> };
    await updateProfile({
      userId: res.locals.user.id,
      paymentStatus: res.locals.user.paymentStatus,
      onboardingStep: res.locals.user.onboardingStep,
      data: { photos: photos.map((photo) => ({ id: photo.photoId, photoIndex: photo.photoIndex })) }
    });
    return res.json({ updated: true });
  })
);

export default router;
