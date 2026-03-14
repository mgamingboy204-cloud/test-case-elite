import { Router } from "express";
import { z } from "zod";
import {
  confirmMockPaymentHandler,
  getMyPaymentHandler,
  initiateOnboardingPaymentHandler,
  mockPaymentUnsupported,
  startMockPaymentHandler,
  validateCouponHandler,
  verifyOnboardingPaymentHandler
} from "../controllers/paymentController";
import { requireAuth, requireAuthHeader, requireOnboardingTokenMatch } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/payments/me", requireAuth, asyncHandler(getMyPaymentHandler));
router.post("/payments/coupon/validate", requireAuth, requireAuthHeader, requireOnboardingTokenMatch, asyncHandler(validateCouponHandler));
router.post(
  "/payments/initiate",
  requireAuth,
  requireAuthHeader,
  requireOnboardingTokenMatch,
  validateBody(
    z.object({
      tier: z.string().min(1),
      cardLast4: z.string().regex(/^\d{4}$/)
    })
  ),
  asyncHandler(initiateOnboardingPaymentHandler)
);
router.post(
  "/payments/verify",
  requireAuth,
  requireAuthHeader,
  requireOnboardingTokenMatch,
  validateBody(
    z.object({
      paymentRef: z.string().min(5)
    })
  ),
  asyncHandler(verifyOnboardingPaymentHandler)
);

router.post("/payments/mock", requireAuth, requireAuthHeader, requireOnboardingTokenMatch, asyncHandler(mockPaymentUnsupported));
router.post("/payments/mock/start", requireAuth, requireAuthHeader, requireOnboardingTokenMatch, asyncHandler(startMockPaymentHandler));
router.post("/payments/mock/confirm", requireAuth, requireAuthHeader, requireOnboardingTokenMatch, asyncHandler(confirmMockPaymentHandler));

export default router;
