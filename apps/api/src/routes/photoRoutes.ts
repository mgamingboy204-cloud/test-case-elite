import { Router } from "express";
import { z } from "zod";
import { deletePhotoHandler, listPhotosHandler, uploadPhotoHandler } from "../controllers/photoController";
import { requireAuth, requireOnboardingTokenMatch } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { updateProfile } from "../services/profileService";

const router = Router();

router.get("/photos/me", requireAuth, asyncHandler(listPhotosHandler));
router.post(
  "/photos/upload",
  requireAuth,
  requireOnboardingTokenMatch,
  validateBody(
    z.object({
      filename: z.string().min(1),
      dataUrl: z.string().min(10),
      cropX: z.number().optional(),
      cropY: z.number().optional(),
      cropZoom: z.number().optional()
    })
  ),
  asyncHandler(uploadPhotoHandler)
);
router.delete(
  "/photos/:photoId",
  requireAuth,
  requireOnboardingTokenMatch,
  asyncHandler(deletePhotoHandler)
);

// PRD compatibility aliases
router.delete(
  "/profile/photos/:photoId",
  requireAuth,
  requireOnboardingTokenMatch,
  asyncHandler(deletePhotoHandler)
);

router.patch(
  "/profile/photos/reorder",
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
      data: { photos: photos.map((p) => ({ id: p.photoId, photoIndex: p.photoIndex })) }
    });
    return res.json({ updated: true });
  })
);

export default router;
