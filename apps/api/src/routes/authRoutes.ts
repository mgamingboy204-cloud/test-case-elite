import { Router } from "express";
import { LoginBodySchema, OtpSendSchema, OtpVerifySchema, RefreshTokenSchema, RegisterBodySchema } from "../validators/authValidators";
import { debugCookies, login, logout, refreshAccessToken, register, sendOtp, verifyOtp } from "../controllers/authController";
import { loginLimiter, otpLimiterByIp, otpLimiterByPhone, otpVerifyLimiter, registerLimiter } from "../middlewares/rateLimiters";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { env } from "../config/env";

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
router.post("/auth/logout", asyncHandler(logout));

if (env.NODE_ENV !== "production") {
  router.get("/debug/cookies", asyncHandler(debugCookies));
}

export default router;
