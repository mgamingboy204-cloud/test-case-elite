import { Router } from "express";
import { z } from "zod";
import {
  getMyPaymentHandler,
  completeMockOnboardingPaymentHandler,
  initiateOnboardingPaymentHandler,
  markOnboardingPaymentFailedHandler,
  validateCouponHandler,
  verifyOnboardingPaymentHandler
} from "../controllers/paymentController";
import { requireAuth, requireOnboardingTokenMatch } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const PaymentPlanSchema = z.enum(["ONE_MONTH", "FIVE_MONTHS", "TWELVE_MONTHS"]);

router.get("/payments/me", requireAuth, asyncHandler(getMyPaymentHandler));
router.post("/payments/coupon/validate", requireAuth, requireOnboardingTokenMatch, asyncHandler(validateCouponHandler));
router.post(
  "/payments/initiate",
  requireAuth,
  requireOnboardingTokenMatch,
  validateBody(
    z.object({
      tier: PaymentPlanSchema
    })
  ),
  asyncHandler(initiateOnboardingPaymentHandler)
);
router.post(
  "/payments/fail",
  requireAuth,
  requireOnboardingTokenMatch,
  validateBody(
    z.object({
      reason: z.string().max(240).optional()
    })
  ),
  asyncHandler(markOnboardingPaymentFailedHandler)
);
router.post(
  "/payments/verify",
  requireAuth,
  requireOnboardingTokenMatch,
  validateBody(
    z.object({
      orderId: z.string().min(5),
      paymentId: z.string().min(5),
      signature: z.string().min(16)
    })
  ),
  asyncHandler(verifyOnboardingPaymentHandler)
);

router.post(
  "/payments/mock/complete",
  requireAuth,
  requireOnboardingTokenMatch,
  asyncHandler(completeMockOnboardingPaymentHandler)
);

export default router;
