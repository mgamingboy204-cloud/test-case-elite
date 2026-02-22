import { Router } from "express";
import { LikeSchema } from "@elite/shared";
import { createLikeHandler, incomingLikesHandler } from "../controllers/likeController";
import { requireAuth } from "../middlewares/auth";
import { requireActive } from "../middlewares/onboarding";
import { likeLimiter } from "../middlewares/rateLimiters";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/likes",
  requireAuth,
  requireActive,
  likeLimiter,
  validateBody(LikeSchema),
  asyncHandler(createLikeHandler)
);
router.get("/likes/incoming", requireAuth, requireActive, asyncHandler(incomingLikesHandler));

export default router;
