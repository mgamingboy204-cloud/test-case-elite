import "dotenv/config";
import { z } from "zod";

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(4000),
    DEV_OTP_LOG: z.enum(["true", "false"]).optional().default("false"),
    ALLOW_TEST_BYPASS: z.enum(["true", "false"]).optional().default("false"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required"),
    JWT_ACCESS_SECRET: z.string().min(1, "JWT_ACCESS_SECRET is required"),
    JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().default(60),
    ACCESS_TOKEN_TTL_MINUTES_SHORT: z.coerce.number().default(30),
    REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),
    REFRESH_TOKEN_TTL_DAYS_SHORT: z.coerce.number().default(7),
    STORAGE_PROVIDER: z.enum(["local", "supabase"]).optional(),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    WEB_ORIGIN: z.string().min(1, "WEB_ORIGIN is required"),
    API_ORIGIN: z.string().optional(),
    ADMIN_ORIGIN: z.string().optional(),
    AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(1000 * 60 * 15),
    AUTH_REGISTER_LIMIT: z.coerce.number().default(5),
    AUTH_LOGIN_LIMIT: z.coerce.number().default(10),
    AUTH_OTP_WINDOW_MS: z.coerce.number().default(1000 * 60 * 60),
    AUTH_OTP_SEND_LIMIT: z.coerce.number().default(5),
    AUTH_OTP_VERIFY_LIMIT: z.coerce.number().default(10),
    MIN_LIKES_FOR_REFUND: z.coerce.number().default(5)
    ,TWILIO_ACCOUNT_SID: z.string().optional()
    ,TWILIO_AUTH_TOKEN: z.string().optional()
    ,TWILIO_VERIFY_SERVICE_SID: z.string().optional()
    ,OTP_COUNTRY_CODE: z.string().optional().default("+91")
    ,RAZORPAY_KEY_ID: z.string().optional()
    ,RAZORPAY_KEY_SECRET: z.string().optional()
  })
  .superRefine((value, ctx) => {
    const isLocal = (url: string) =>
      url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1");

    if (value.NODE_ENV === "production") {
      if (!value.WEB_ORIGIN.startsWith("https://")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["WEB_ORIGIN"],
          message: "WEB_ORIGIN must be https in production."
        });
      }
      if (value.ADMIN_ORIGIN && !value.ADMIN_ORIGIN.startsWith("https://")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ADMIN_ORIGIN"],
          message: "ADMIN_ORIGIN must be https in production."
        });
      }
      if (value.API_ORIGIN && !value.API_ORIGIN.startsWith("https://")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["API_ORIGIN"],
          message: "API_ORIGIN must be https in production."
        });
      }
    } else {
      if (!value.WEB_ORIGIN.startsWith("https://") && !isLocal(value.WEB_ORIGIN)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["WEB_ORIGIN"],
          message: "WEB_ORIGIN must be https (unless localhost)."
        });
      }
      if (
        value.API_ORIGIN &&
        !value.API_ORIGIN.startsWith("https://") &&
        !isLocal(value.API_ORIGIN)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["API_ORIGIN"],
          message: "API_ORIGIN must be https (unless localhost)."
        });
      }
      if (
        value.ADMIN_ORIGIN &&
        !value.ADMIN_ORIGIN.startsWith("https://") &&
        !isLocal(value.ADMIN_ORIGIN)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ADMIN_ORIGIN"],
          message: "ADMIN_ORIGIN must be https (unless localhost)."
        });
      }
    }
    const provider = value.STORAGE_PROVIDER ?? (value.NODE_ENV === "production" ? "supabase" : "local");
    if (provider === "supabase") {
      if (!value.SUPABASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["SUPABASE_URL"],
          message: "SUPABASE_URL is required when STORAGE_PROVIDER is supabase."
        });
      }
      if (!value.SUPABASE_SERVICE_ROLE_KEY) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["SUPABASE_SERVICE_ROLE_KEY"],
          message: "SUPABASE_SERVICE_ROLE_KEY is required when STORAGE_PROVIDER is supabase."
        });
      }
    }
    if (value.NODE_ENV === "production") {
      if (!value.TWILIO_ACCOUNT_SID || !value.TWILIO_AUTH_TOKEN || !value.TWILIO_VERIFY_SERVICE_SID) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["TWILIO_ACCOUNT_SID"],
          message: "Twilio credentials are required in production."
        });
      }
      if (!value.RAZORPAY_KEY_ID || !value.RAZORPAY_KEY_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["RAZORPAY_KEY_ID"],
          message: "Razorpay credentials are required in production."
        });
      }
    }
    return ctx;
  });

const parsed = EnvSchema.parse(process.env);

export const env = {
  ...parsed,
  WEB_ORIGIN: parsed.WEB_ORIGIN,
  STORAGE_PROVIDER: parsed.STORAGE_PROVIDER ?? (parsed.NODE_ENV === "production" ? "supabase" : "local"),
  ALLOW_TEST_BYPASS: parsed.ALLOW_TEST_BYPASS === "true"
};
