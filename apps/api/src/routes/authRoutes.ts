import { Router } from "express";
import { LoginBodySchema, OtpSendSchema, OtpVerifySchema, RefreshTokenSchema, RegisterBodySchema } from "../validators/authValidators";
import { login, logout, refreshAccessToken, register, sendOtp, verifyOtp } from "../controllers/authController";
import { loginLimiter, otpLimiterByIp, otpLimiterByPhone, otpVerifyLimiter, registerLimiter } from "../middlewares/rateLimiters";
import { requireAuth, requireAuthHeader } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/auth/otp/send",
  otpLimiterByIp,
  otpLimiterByPhone,
  validateBody(OtpSendSchema),
  asyncHandler(sendOtp)
);

router.post(
  "/auth/otp/verify",
  otpVerifyLimiter,
  validateBody(OtpVerifySchema),
  asyncHandler(verifyOtp)
);

router.post("/auth/register", registerLimiter, validateBody(RegisterBodySchema), asyncHandler(register));

router.post(
  "/auth/login",
  loginLimiter,
  validateBody(LoginBodySchema),
  asyncHandler(login)
);

router.post("/auth/token/refresh", validateBody(RefreshTokenSchema), asyncHandler(refreshAccessToken));
router.post("/auth/logout", requireAuth, requireAuthHeader, asyncHandler(logout));

export default router;
