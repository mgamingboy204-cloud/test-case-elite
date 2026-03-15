import { Router } from "express";
import {
  LoginBodySchema,
  EmployeeLoginSchema,
  OtpSendSchema,
  OtpMockVerifySchema,
  OtpVerifySchema,
  RefreshTokenSchema,
  RegisterBodySchema,
  SignupCompleteSchema,
  SignupStartSchema,
  SignupVerifySchema
} from "../validators/authValidators";
import {
  debugCookies,
  employeeLogin,
  login,
  logout,
  refreshAccessToken,
  register,
  sendOtp,
  signupComplete,
  signupStart,
  signupVerify,
  signupVerifyMock,
  verifyOtpMock,
  verifyOtp
} from "../controllers/authController";
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

router.post(
  "/auth/otp/mock-verify",
  otpVerifyLimiter,
  validateBody(OtpMockVerifySchema),
  asyncHandler(verifyOtpMock)
);

router.post("/auth/register", registerLimiter, validateBody(RegisterBodySchema), asyncHandler(register));
router.post("/auth/signup/start", otpLimiterByIp, otpLimiterByPhone, validateBody(SignupStartSchema), asyncHandler(signupStart));
router.post("/auth/signup/verify", otpVerifyLimiter, validateBody(SignupVerifySchema), asyncHandler(signupVerify));
router.post("/auth/signup/mock-verify", otpVerifyLimiter, validateBody(OtpMockVerifySchema), asyncHandler(signupVerifyMock));
router.post("/auth/signup/complete", registerLimiter, validateBody(SignupCompleteSchema), asyncHandler(signupComplete));

router.post(
  "/auth/login",
  loginLimiter,
  validateBody(LoginBodySchema),
  asyncHandler(login)
);

router.post(
  "/employee/auth/login",
  loginLimiter,
  validateBody(EmployeeLoginSchema),
  asyncHandler(employeeLogin)
);

router.post("/auth/token/refresh", validateBody(RefreshTokenSchema), asyncHandler(refreshAccessToken));
router.post("/auth/logout", asyncHandler(logout));

if (env.NODE_ENV !== "production") {
  router.get("/debug/cookies", asyncHandler(debugCookies));
}

export default router;
