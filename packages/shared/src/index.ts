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
    dateOfBirth: z.coerce.date(),
    gender: GenderSchema,
    age: z.number().int().min(18),
    heightCm: z.number().int().min(120).max(240),
    city: z.string().min(1),
    place: z.string().min(1).optional(),
    profession: z.string().min(1),
    bioShort: z.string().min(1),
    bio: z.string().min(1).optional(),
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

    if (value.dateOfBirth) {
      const now = new Date();
      let age = now.getUTCFullYear() - value.dateOfBirth.getUTCFullYear();
      const monthDiff = now.getUTCMonth() - value.dateOfBirth.getUTCMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < value.dateOfBirth.getUTCDate())) {
        age -= 1;
      }

      if (age < 18) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dateOfBirth"],
          message: "Members must be 18 or older."
        });
      }
    }
  });


export const ProfilePatchSchema = z.object({
  profession: z.string().min(1).optional(),
  heightCm: z.number().int().min(120).max(240).optional().nullable(),
  bioShort: z.string().min(1).optional(),
  story: z.string().min(1).optional().nullable(),
  city: z.string().min(1).optional(),
  locationLabel: z.string().min(1).optional().nullable(),
  photos: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        url: z.string().min(1),
        photoIndex: z.number().int().min(0)
      })
    )
    .optional(),
  settings: z
    .object({
      pushNotificationsEnabled: z.boolean().optional(),
      profileVisible: z.boolean().optional(),
      showOnlineStatus: z.boolean().optional(),
      discoverableByPremiumOnly: z.boolean().optional()
    })
    .optional()
});

export const LikeSchema = z.object({
  actionId: z.string().min(1).max(128),
  targetUserId: z.string().uuid(),
  action: z.enum(["LIKE", "PASS"])
});

export const ConsentTypeSchema = z.enum(["PHONE_NUMBER", "OFFLINE_MEET", "ONLINE_MEET", "SOCIAL_EXCHANGE"]);

export const ConsentSchema = z.object({
  matchId: z.string().uuid(),
  response: z.enum(["YES", "NO"]),
  type: ConsentTypeSchema.default("PHONE_NUMBER"),
  payload: z.record(z.string(), z.unknown()).optional().nullable()
});


export const OfflineMeetSelectionSchema = z.object({
  cafes: z.array(z.string().min(1)).length(2),
  timeSlots: z.array(z.string().min(1)).min(3).max(4)
});

export const OfflineMeetOptionsSchema = z.object({
  cafes: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), address: z.string().min(1) })).length(3),
  timeSlots: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), startsAtIso: z.string().datetime().optional().nullable() })).min(3)
});

export const OfflineMeetFinalizeSchema = z.object({
  finalCafeId: z.string().min(1),
  finalTimeSlotId: z.string().min(1)
});

export const OfflineMeetNoResponseSchema = z.object({
  nonResponderUserId: z.string().uuid()
});

export const OfflineMeetAdminCancelSchema = z.object({
  action: z.enum(["CANCEL", "RESCHEDULE"]),
  reason: z.string().min(1),
  requestedByUserId: z.string().uuid().optional().nullable()
});


export const OnlineMeetSelectionSchema = z.object({
  platform: z.enum(["ZOOM", "GOOGLE_MEET"]),
  timeSlots: z.array(z.string().min(1)).min(2).max(4)
});

export const OnlineMeetOptionsSchema = z.object({
  platforms: z.array(z.enum(["ZOOM", "GOOGLE_MEET"])) .min(1),
  timeSlots: z.array(z.object({ id: z.string().min(1), label: z.string().min(1), startsAtIso: z.string().datetime().optional().nullable() })).min(2)
});

export const OnlineMeetFinalizeSchema = z.object({
  finalPlatform: z.enum(["ZOOM", "GOOGLE_MEET"]),
  finalTimeSlotId: z.string().min(1),
  finalMeetingLink: z.string().url()
});

export const OnlineMeetNoResponseSchema = z.object({
  nonResponderUserId: z.string().uuid()
});

export const OnlineMeetAdminCancelSchema = z.object({
  action: z.enum(["CANCEL", "RESCHEDULE"]),
  reason: z.string().min(1),
  requestedByUserId: z.string().uuid().optional().nullable()
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
export type ProfilePatchInput = z.infer<typeof ProfilePatchSchema>;

export * from "./onboarding";
