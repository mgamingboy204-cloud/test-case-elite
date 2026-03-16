import { Router } from "express";
import { z } from "zod";
import { deletePhotoHandler, listPhotosHandler, uploadPhotoHandler } from "../controllers/photoController";
import { requireAuth, requireOnboardingTokenMatch } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

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

export default router;
