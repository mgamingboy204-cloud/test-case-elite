import { z } from "zod";

const PhoneSchema = z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits.");

const GenderSchema = z.enum(["MALE", "FEMALE", "NON_BINARY", "OTHER"]);

export const RegisterSchema = z.object({
  phone: PhoneSchema,
  email: z.string().email().optional().nullable(),
  password: z.string().min(8),
  name: z.string().min(1).optional().nullable()
});

export const LoginSchema = z.object({
  phone: PhoneSchema,
  password: z.string().min(8),
  rememberDevice30Days: z.boolean().optional(),
  rememberDevice: z.boolean().optional(),
  rememberMe: z.boolean().optional()
});

export const ProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    firstName: z.string().min(1).optional().nullable(),
    lastName: z.string().min(1).optional().nullable(),
    gender: GenderSchema,
    age: z.number().int().min(18),
    city: z.string().min(1),
    profession: z.string().min(1),
    bioShort: z.string().min(1),
    intent: z.enum(["dating", "friends", "all"]).default("dating")
  })
  .superRefine((value, ctx) => {
    if (!value.displayName && !value.name) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["displayName"],
        message: "Display name is required."
      });
    }
  });

export const LikeSchema = z.object({
  toUserId: z.string().uuid(),
  type: z.enum(["LIKE", "PASS"])
});

export const ConsentSchema = z.object({
  matchId: z.string().uuid(),
  response: z.enum(["YES", "NO"])
});

export const ReportSchema = z.object({
  reportedUserId: z.string().uuid(),
  reason: z.string().min(1),
  details: z.string().optional().nullable()
});

export const RefundRequestSchema = z.object({
  reason: z.string().optional().nullable()
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ProfileInput = z.infer<typeof ProfileSchema>;
