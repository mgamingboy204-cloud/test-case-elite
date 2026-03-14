import { Router } from "express";
import { z } from "zod";
import {
  createVerificationRequestHandler,
  getMyVerificationRequestHandler,
  getMyVerificationStatusHandler,
  getVerificationStatusHandler,
  uploadVerificationVideoHandler
} from "../controllers/verificationController";
import { requireAuth, requireAuthHeader, requireOnboardingTokenMatch } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/verification-requests",
  requireAuth,
  requireAuthHeader,
  requireOnboardingTokenMatch,
  asyncHandler(createVerificationRequestHandler)
);
router.post(
  "/verification/video",
  requireAuth,
  requireAuthHeader,
  requireOnboardingTokenMatch,
  validateBody(
    z.object({
      videoDataUrl: z.string().min(20)
    })
  ),
  asyncHandler(uploadVerificationVideoHandler)
);
router.get("/verification-requests/me", requireAuth, asyncHandler(getMyVerificationRequestHandler));
router.get("/verification/status", requireAuth, asyncHandler(getVerificationStatusHandler));
router.get("/me/verification-status", requireAuth, asyncHandler(getMyVerificationStatusHandler));

export default router;
