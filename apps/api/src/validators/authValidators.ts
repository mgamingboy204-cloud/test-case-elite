import { z } from "zod";
import { LoginSchema, RegisterSchema } from "@elite/shared";

export const RegisterBodySchema = RegisterSchema;
export const LoginBodySchema = LoginSchema;

export const OtpSendSchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits.")
});

export const OtpVerifySchema = z.object({
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits."),
  code: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits."),
  rememberMe: z.boolean().optional()
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().optional()
});
