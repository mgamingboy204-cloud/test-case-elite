import "dotenv/config";
import { z } from "zod";

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(4000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    SESSION_SECRET: z.string().min(1, "SESSION_SECRET is required").default("dev_secret"),
    WEB_ORIGIN: z.string().min(1, "WEB_ORIGIN is required").default("http://localhost:3000"),
    ADMIN_ORIGIN: z.string().optional(),
    AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(1000 * 60 * 15),
    AUTH_REGISTER_LIMIT: z.coerce.number().default(5),
    AUTH_LOGIN_LIMIT: z.coerce.number().default(10),
    AUTH_OTP_WINDOW_MS: z.coerce.number().default(1000 * 60 * 60),
    AUTH_OTP_SEND_LIMIT: z.coerce.number().default(5),
    AUTH_OTP_VERIFY_LIMIT: z.coerce.number().default(10),
    MIN_LIKES_FOR_REFUND: z.coerce.number().default(5)
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV === "production" && value.SESSION_SECRET === "dev_secret") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["SESSION_SECRET"],
        message: "SESSION_SECRET must be set in production."
      });
    }
    if (value.NODE_ENV === "production" && value.WEB_ORIGIN === "http://localhost:3000") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["WEB_ORIGIN"],
        message: "WEB_ORIGIN must be set in production."
      });
    }
    return ctx;
  });

const parsed = EnvSchema.parse(process.env);

export const env = {
  ...parsed,
  WEB_ORIGIN: parsed.WEB_ORIGIN
};
