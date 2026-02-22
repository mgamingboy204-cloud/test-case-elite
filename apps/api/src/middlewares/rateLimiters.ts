import rateLimit from "express-rate-limit";
import { env } from "../config/env";

export const otpLimiterByIp = rateLimit({
  windowMs: env.AUTH_OTP_WINDOW_MS,
  limit: env.AUTH_OTP_SEND_LIMIT,
  standardHeaders: true,
  legacyHeaders: false
});

export const otpLimiterByPhone = rateLimit({
  windowMs: env.AUTH_OTP_WINDOW_MS,
  limit: env.AUTH_OTP_SEND_LIMIT,
  keyGenerator: (req) => String(req.body.phone ?? ""),
  standardHeaders: true,
  legacyHeaders: false
});

export const otpVerifyLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_OTP_VERIFY_LIMIT,
  keyGenerator: (req) => String(req.body.phone ?? req.ip),
  standardHeaders: true,
  legacyHeaders: false
});

export const loginLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_LOGIN_LIMIT,
  standardHeaders: true,
  legacyHeaders: false
});

export const registerLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_REGISTER_LIMIT,
  standardHeaders: true,
  legacyHeaders: false
});

export const likeLimiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 60,
  keyGenerator: (req) => String(req.user?.id ?? req.session?.userId ?? req.ip)
});
