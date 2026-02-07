import { Router } from "express";
import {
  confirmMockPaymentHandler,
  getMyPaymentHandler,
  mockPaymentUnsupported,
  startMockPaymentHandler,
  validateCouponHandler
} from "../controllers/paymentController";
import { requireAuth, requireAuthHeader } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/payments/me", requireAuth, asyncHandler(getMyPaymentHandler));
router.post("/payments/coupon/validate", requireAuth, requireAuthHeader, asyncHandler(validateCouponHandler));
router.post("/payments/mock", requireAuth, requireAuthHeader, asyncHandler(mockPaymentUnsupported));
router.post("/payments/mock/start", requireAuth, requireAuthHeader, asyncHandler(startMockPaymentHandler));
router.post("/payments/mock/confirm", requireAuth, requireAuthHeader, asyncHandler(confirmMockPaymentHandler));

export default router;
