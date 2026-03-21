import { Router } from "express";
import {
  createVerificationRequestHandler,
  getVerificationStatusHandler,
  requestVerificationWhatsAppHelpHandler
} from "../controllers/verificationController";
import { requireAuth, requireOnboardingTokenMatch } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/verification-requests",
  requireAuth,
  requireOnboardingTokenMatch,
  asyncHandler(createVerificationRequestHandler)
);

router.post(
  "/verification/help/whatsapp",
  requireAuth,
  requireOnboardingTokenMatch,
  asyncHandler(requestVerificationWhatsAppHelpHandler)
);
router.get("/verification/status", requireAuth, asyncHandler(getVerificationStatusHandler));

export default router;
