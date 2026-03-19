import { z } from "zod";
import { LoginSchema, RegisterSchema } from "@vael/shared";

export const RegisterBodySchema = RegisterSchema;
export const LoginBodySchema = LoginSchema;
export const EmployeeLoginSchema = z.object({
  employeeId: z.string().trim().min(2),
  password: z.string().min(8),
  rememberMe: z.boolean().optional()
});

export const OtpSendSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits.")
});

export const OtpVerifySchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits."),
  code: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits."),
  rememberMe: z.boolean().optional()
});

// Compatibility schema for PRD-style payloads that send `otp` instead of `code`.
// This allows both shapes while reusing the same downstream controller logic.
export const OtpVerifyCompatSchema = OtpVerifySchema.or(
  z.object({
    phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits."),
    otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits."),
    rememberMe: z.boolean().optional()
  })
);

export const OtpMockVerifySchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits."),
  rememberMe: z.boolean().optional()
});

export const RefreshTokenSchema = z
  .object({
    refreshToken: z.string().optional()
  })
  .default({});

export const SignupStartSchema = OtpSendSchema;

export const SignupVerifySchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits."),
  code: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits.")
});

export const SignupCompleteSchema = z.object({
  signupToken: z.string().min(10),
  password: z.string().min(8)
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(8).max(256)
});
