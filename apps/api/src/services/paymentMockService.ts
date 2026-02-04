import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

export async function startMockPayment(user: { id: string; videoVerificationStatus: string; onboardingStep: string }) {
  if (user.videoVerificationStatus !== "APPROVED") {
    throw new HttpError(403, {
      error: "Verification required",
      currentStep: user.onboardingStep,
      requiredStep: "VIDEO_VERIFIED",
      redirectTo: "/onboarding/video-verification"
    });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      paymentStatus: "PENDING",
      onboardingStep: "PAYMENT_PENDING"
    }
  });
  return { ok: true, paymentStatus: "PENDING" };
}

export async function confirmMockPayment(user: { id: string; videoVerificationStatus: string; onboardingStep: string }) {
  if (user.videoVerificationStatus !== "APPROVED") {
    throw new HttpError(403, {
      error: "Verification required",
      currentStep: user.onboardingStep,
      requiredStep: "VIDEO_VERIFIED",
      redirectTo: "/onboarding/video-verification"
    });
  }
  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      plan: "YEARLY",
      amount: 100000,
      status: "PAID",
      paidAt: new Date()
    }
  });
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      paymentStatus: "PAID",
      onboardingStep: "PAID"
    }
  });
  return { payment, paymentStatus: updatedUser.paymentStatus, onboardingStep: updatedUser.onboardingStep };
}
