import { z } from "zod";

export const VerificationStatus = [
  "NOT_REQUESTED",
  "REQUESTED",
  "IN_PROGRESS",
  "COMPLETED",
  "REJECTED"
] as const;

export type VerificationStatus = (typeof VerificationStatus)[number];

export const PhoneSchema = z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits.");
export const GenderSchema = z.enum(["MALE", "FEMALE", "NON_BINARY", "OTHER"]);
export const GenderPreferenceSchema = z.enum(["MALE", "FEMALE", "NON_BINARY", "OTHER", "ALL"]);
export const RoleSchema = z.enum(["USER", "ADMIN"]);
export const UserStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED", "BANNED"]);
export const VideoVerificationStatusSchema = z.enum(["NOT_REQUESTED", "PENDING", "IN_PROGRESS", "APPROVED", "REJECTED"]);
export const VerificationRequestStatusSchema = z.enum(["REQUESTED", "IN_PROGRESS", "COMPLETED", "REJECTED"]);
export const OnboardingPaymentStatusSchema = z.enum(["NOT_STARTED", "PENDING", "PAID", "FAILED"]);

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

export const OtpSendSchema = z.object({ phone: PhoneSchema });
export const OtpVerifySchema = z.object({
  phone: PhoneSchema,
  code: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits."),
  rememberMe: z.boolean().optional()
});
export const RefreshTokenSchema = z.object({ refreshToken: z.string().optional() });

export const ProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    firstName: z.string().min(1).optional().nullable(),
    lastName: z.string().min(1).optional().nullable(),
    gender: GenderSchema,
    genderPreference: GenderPreferenceSchema.optional().default("ALL"),
    age: z.number().int().min(18),
    city: z.string().min(1),
    profession: z.string().min(1),
    bioShort: z.string().min(1),
    preferences: z.record(z.any()).default({})
  })
  .superRefine((value, ctx) => {
    if (!value.displayName && !value.name) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["displayName"], message: "Display name is required." });
    }
  });

export const LikeSchema = z.object({ toUserId: z.string().uuid(), type: z.enum(["LIKE", "PASS"]) });
export const ConsentSchema = z.object({ matchId: z.string().uuid(), response: z.enum(["YES", "NO"]) });
export const ReportSchema = z.object({ reportedUserId: z.string().uuid(), reason: z.string().min(1), details: z.string().optional().nullable() });
export const RefundRequestSchema = z.object({ reason: z.string().optional().nullable() });

export const SessionUserSchema = z.object({
  id: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  displayName: z.string().nullable(),
  gender: z.string().nullable(),
  role: RoleSchema,
  isAdmin: z.boolean(),
  status: UserStatusSchema,
  verifiedAt: z.string().nullable(),
  phoneVerifiedAt: z.string().nullable(),
  onboardingStep: z.string(),
  videoVerificationStatus: VideoVerificationStatusSchema,
  paymentStatus: OnboardingPaymentStatusSchema,
  profileCompletedAt: z.string().nullable(),
  onboardingStatus: z.object({ nextRequiredStep: z.string(), nextRoute: z.string() })
});

export const AuthSuccessSchema = z.object({ ok: z.literal(true), accessToken: z.string(), user: SessionUserSchema });
export const AuthOtpSendResponseSchema = z.object({ ok: z.literal(true) });
export const AuthRegisterResponseSchema = z.object({ ok: z.literal(true), otpRequired: z.literal(true) });
export const AuthRefreshResponseSchema = z.object({ ok: z.literal(true), accessToken: z.string() });
export const AuthLogoutResponseSchema = z.object({ ok: z.literal(true) });

export const VerificationRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  status: VerificationRequestStatusSchema,
  meetUrl: z.string().nullable(),
  verificationLink: z.string().nullable(),
  linkExpiresAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const VerificationRequestEnvelopeSchema = z.object({ request: VerificationRequestSchema.nullable() });
export const VerificationStatusSchema = z.object({ status: VerificationRequestStatusSchema.or(z.literal("NOT_REQUESTED")), meetUrl: z.string().nullable() });

export const ProfileReadResponseSchema = z.object({
  profile: z.object({
    userId: z.string().uuid(),
    name: z.string(),
    gender: GenderSchema,
    genderPreference: GenderPreferenceSchema,
    age: z.number().int(),
    city: z.string(),
    profession: z.string(),
    bioShort: z.string(),
    preferences: z.record(z.any())
  }).nullable(),
  photos: z.array(z.object({ id: z.string().uuid(), userId: z.string().uuid(), url: z.string(), createdAt: z.string() })),
  user: z.object({ firstName: z.string().nullable(), lastName: z.string().nullable(), displayName: z.string().nullable(), gender: z.string().nullable() }).nullable()
});

export const ProfileUpdateResponseSchema = z.object({
  profile: ProfileReadResponseSchema.shape.profile.unwrap(),
  requiresPhoto: z.boolean(),
  onboardingStep: z.string()
});

export const ProfileCompleteResponseSchema = z.object({ ok: z.literal(true), onboardingStep: z.string() });

export type SessionUser = z.infer<typeof SessionUserSchema>;
export type VideoVerificationStatus = z.infer<typeof VideoVerificationStatusSchema>;
