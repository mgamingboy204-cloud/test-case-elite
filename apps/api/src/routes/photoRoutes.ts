import { Router } from "express";
import { z } from "zod";
import { listPhotosHandler, uploadPhotoHandler } from "../controllers/photoController";
import { requireAuth, requireAuthHeader } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/photos/me", requireAuth, asyncHandler(listPhotosHandler));
router.post(
  "/photos/upload",
  requireAuth,
  requireAuthHeader,
  validateBody(
    z.object({
      filename: z.string().min(1),
      dataUrl: z.string().min(10)
    })
  ),
  asyncHandler(uploadPhotoHandler)
);

export default router;
