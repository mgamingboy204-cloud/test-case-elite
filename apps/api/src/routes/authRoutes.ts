import { Router } from "express";
import {
  LoginBodySchema,
  EmployeeLoginSchema,
  OtpSendSchema,
  OtpMockVerifySchema,
  OtpVerifySchema,
  OtpVerifyCompatSchema,
  RefreshTokenSchema,
  RegisterBodySchema,
  SignupCompleteSchema,
  SignupStartSchema,
  SignupVerifySchema,
  ChangePasswordSchema
} from "../validators/authValidators";
import {
  employeeLogin,
  login,
  logout,
  changePasswordHandler,
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
import { requireAuth } from "../middlewares/auth";

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

// PRD: POST /api/auth/change-password
router.post(
  "/auth/change-password",
  requireAuth,
  validateBody(ChangePasswordSchema),
  asyncHandler(changePasswordHandler)
);

// PRD compatibility aliases
// These provide the documented `/auth/request-otp` and `/auth/verify-otp` shapes
// while delegating to the existing OTP controllers.

router.post(
  "/auth/request-otp",
  otpLimiterByIp,
  otpLimiterByPhone,
  validateBody(OtpSendSchema),
  asyncHandler(sendOtp)
);

router.post(
  "/auth/verify-otp",
  otpVerifyLimiter,
  validateBody(OtpVerifyCompatSchema),
  asyncHandler(async (req, res) => {
    // Normalize `otp` to `code` so the main verifier can handle both shapes.
    if (!("code" in req.body) && typeof req.body.otp === "string") {
      req.body.code = req.body.otp;
    }
    return verifyOtp(req, res);
  })
);

export default router;
