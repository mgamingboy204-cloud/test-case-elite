import { Router } from "express";
import { LikeSchema } from "@vael/shared";
import { createLikeHandler, incomingLikesHandler, outgoingLikesHandler } from "../controllers/likeController";
import { requireAuth } from "../middlewares/auth";
import { requireMatchingEligible } from "../middlewares/onboarding";
import { likeLimiter } from "../middlewares/rateLimiters";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/likes",
  requireAuth,
  requireMatchingEligible,
  likeLimiter,
  validateBody(LikeSchema),
  asyncHandler(createLikeHandler)
);
router.get("/likes/incoming", requireAuth, requireMatchingEligible, asyncHandler(incomingLikesHandler));
router.get("/likes/outgoing", requireAuth, requireMatchingEligible, asyncHandler(outgoingLikesHandler));

export default router;
