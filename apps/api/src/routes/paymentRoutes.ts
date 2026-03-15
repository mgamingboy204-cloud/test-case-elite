import { Router } from "express";
import { z } from "zod";
import {
  getMyPaymentHandler,
  initiateOnboardingPaymentHandler,
  markOnboardingPaymentFailedHandler,
  validateCouponHandler,
  verifyOnboardingPaymentHandler
} from "../controllers/paymentController";
import { requireAuth, requireAuthHeader, requireOnboardingTokenMatch } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const PaymentPlanSchema = z.enum(["ONE_MONTH", "FIVE_MONTHS", "TWELVE_MONTHS"]);

router.get("/payments/me", requireAuth, asyncHandler(getMyPaymentHandler));
router.post("/payments/coupon/validate", requireAuth, requireAuthHeader, requireOnboardingTokenMatch, asyncHandler(validateCouponHandler));
router.post(
  "/payments/initiate",
  requireAuth,
  requireAuthHeader,
  requireOnboardingTokenMatch,
  validateBody(
    z.object({
      tier: PaymentPlanSchema,
      cardLast4: z.string().regex(/^\d{4}$/)
    })
  ),
  asyncHandler(initiateOnboardingPaymentHandler)
);
router.post(
  "/payments/fail",
  requireAuth,
  requireAuthHeader,
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
  requireAuthHeader,
  requireOnboardingTokenMatch,
  validateBody(
    z.object({
      paymentRef: z.string().min(5)
    })
  ),
  asyncHandler(verifyOnboardingPaymentHandler)
);

export default router;
