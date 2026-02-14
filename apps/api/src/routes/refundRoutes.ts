import { Router } from "express";
import { RefundRequestSchema } from "@elite/contracts";
import { listRefundsHandler, requestRefundHandler } from "../controllers/refundController";
import { requireAuth, requireAuthHeader } from "../middlewares/auth";
import { requireActive } from "../middlewares/onboarding";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/refunds/request",
  requireAuth,
  requireAuthHeader,
  requireActive,
  validateBody(RefundRequestSchema),
  asyncHandler(requestRefundHandler)
);
router.get("/refunds/me", requireAuth, requireActive, asyncHandler(listRefundsHandler));

export default router;
