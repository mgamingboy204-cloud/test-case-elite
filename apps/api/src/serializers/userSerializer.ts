import { User as PrismaUser } from "@prisma/client";

type AuthSessionUser = Pick<
  PrismaUser,
  | "id"
  | "phone"
  | "email"
  | "firstName"
  | "lastName"
  | "displayName"
  | "gender"
  | "role"
  | "isAdmin"
  | "status"
  | "verifiedAt"
  | "phoneVerifiedAt"
  | "videoVerificationStatus"
  | "paymentStatus"
  | "profileCompletedAt"
> & {
  onboardingStep: string;
};

function getNextRequiredStep(user: {
  videoVerificationStatus: string;
  paymentStatus: string;
  profileCompletedAt: Date | null;
}) {
  const isVideoVerified = user.videoVerificationStatus === "APPROVED" || user.videoVerificationStatus === "COMPLETED";
  if (!isVideoVerified) return "VIDEO_VERIFICATION_REQUIRED";
  if (user.paymentStatus !== "PAID") return "PAYMENT_REQUIRED";
  if (!user.profileCompletedAt) return "PROFILE_SETUP_REQUIRED";
  return "APP_READY";
}

function getNextRouteFromStatus(user: {
  videoVerificationStatus: string;
  paymentStatus: string;
  profileCompletedAt: Date | null;
}) {
  const step = getNextRequiredStep(user);
  if (step === "VIDEO_VERIFICATION_REQUIRED") return "/onboarding/video-verification";
  if (step === "PAYMENT_REQUIRED") return "/onboarding/payment";
  if (step === "PROFILE_SETUP_REQUIRED") return "/onboarding/profile-setup";
  return "/app";
}

export function toUserDTO(user: AuthSessionUser) {
  const nextRequiredStep = getNextRequiredStep(user);

  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    displayName: user.displayName,
    gender: user.gender,
    role: user.role,
    isAdmin: user.isAdmin,
    status: user.status,
    verifiedAt: user.verifiedAt ? user.verifiedAt.toISOString() : null,
    phoneVerifiedAt: user.phoneVerifiedAt ? user.phoneVerifiedAt.toISOString() : null,
    onboardingStep: user.onboardingStep,
    videoVerificationStatus: user.videoVerificationStatus,
    paymentStatus: user.paymentStatus,
    profileCompletedAt: user.profileCompletedAt ? user.profileCompletedAt.toISOString() : null,
    onboardingStatus: {
      nextRequiredStep,
      nextRoute: getNextRouteFromStatus(user)
    }
  };
}
