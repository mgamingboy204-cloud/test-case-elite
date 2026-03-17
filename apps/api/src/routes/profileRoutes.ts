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
import { confirmPhotoUploadHandler, deletePhotoHandler, reorderProfilePhotosHandler, requestPhotoUploadUrlHandler } from "../controllers/photoController";

const router = Router();

function registerProfileRoutes(basePath: "/profile" | "/me/profile" | "/api/profile") {
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
  router.patch(
    `${basePath}/photos/reorder`,
    requireAuth,
    requireOnboardingTokenMatch,
    validateBody(
      z.object({
        photoIds: z.array(z.string().min(1)).min(1).max(3)
      })
    ),
    asyncHandler(reorderProfilePhotosHandler)
  );
  router.delete(
    `${basePath}/photos/:photoId`,
    requireAuth,
    requireOnboardingTokenMatch,
    asyncHandler(deletePhotoHandler)
  );
  router.post(`${basePath}/complete`, requireAuth, requireOnboardingTokenMatch, asyncHandler(completeProfileHandler));
}

registerProfileRoutes("/me/profile");

// Backwards-compatible aliases for older clients.
registerProfileRoutes("/profile");
registerProfileRoutes("/api/profile");

export default router;
