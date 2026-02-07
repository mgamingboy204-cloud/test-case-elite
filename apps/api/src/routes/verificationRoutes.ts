import { Router } from "express";
import {
  createVerificationRequestHandler,
  getMyVerificationRequestHandler,
  getMyVerificationStatusHandler,
  getVerificationStatusHandler
} from "../controllers/verificationController";
import { requireAuth, requireAuthHeader } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/verification-requests",
  requireAuth,
  requireAuthHeader,
  asyncHandler(createVerificationRequestHandler)
);
router.get("/verification-requests/me", requireAuth, asyncHandler(getMyVerificationRequestHandler));
router.get("/verification/status", requireAuth, asyncHandler(getVerificationStatusHandler));
router.get("/me/verification-status", requireAuth, asyncHandler(getMyVerificationStatusHandler));

export default router;
