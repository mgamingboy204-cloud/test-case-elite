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

// PRD-style alias: POST /payment/create-order
// Returns Razorpay-order-compatible payload for the selected plan.
router.post(
  "/payment/create-order",
  requireAuth,
  requireOnboardingTokenMatch,
  validateBody(
    z.object({
      plan: PaymentPlanSchema
    })
  ),
  asyncHandler(async (req, res) => {
    const { plan } = req.body as { plan: z.infer<typeof PaymentPlanSchema> };
    const result = await initiateOnboardingPaymentHandler(
      // reuse existing controller but adapt body shape
      Object.assign(req, { body: { tier: plan } }) as typeof req,
      res
    );

    // If using Razorpay gateway, adapt to PRD response shape.
    if (
      result &&
      typeof result === "object" &&
      "gateway" in result &&
      (result as { gateway?: string }).gateway === "razorpay"
    ) {
      const payload = (result as unknown) as {
        paymentRef: string;
        razorpay: { keyId: string; orderId: string; amountPaise: number; currency: string };
        plan: string;
        amountInr: number;
      };
      return res.json({
        orderId: payload.razorpay.orderId,
        amount: payload.razorpay.amountPaise,
        currency: payload.razorpay.currency,
        key: payload.razorpay.keyId,
        plan: payload.plan,
        amountInr: payload.amountInr
      });
    }

    return result;
  })
);

export default router;
