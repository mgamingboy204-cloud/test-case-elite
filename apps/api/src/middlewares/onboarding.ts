import { NextFunction, Request, Response } from "express";
import { onboardingRedirectForBackendStep } from "@vael/shared";

export function requireActive(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;
  if (user.onboardingStep !== "ACTIVE") {
    const redirectTo = onboardingRedirectForBackendStep(user.onboardingStep);
    return res.status(403).json({
      message: "Onboarding incomplete",
      currentStep: user.onboardingStep,
      requiredStep: "ACTIVE",
      redirectTo
    });
  }
  return next();
}

export function requireMatchingEligible(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;

  if (!user || user.onboardingStep !== "ACTIVE") {
    const redirectTo = onboardingRedirectForBackendStep(user?.onboardingStep ?? "PHONE_VERIFIED");
    return res.status(403).json({
      message: "Onboarding incomplete",
      currentStep: user?.onboardingStep ?? null,
      requiredStep: "ACTIVE",
      redirectTo
    });
  }

  if (user.status !== "APPROVED" || user.videoVerificationStatus !== "APPROVED" || user.paymentStatus !== "PAID") {
    return res.status(403).json({
      message: "Account not eligible for matching",
      currentStatus: user.status,
      videoVerificationStatus: user.videoVerificationStatus,
      paymentStatus: user.paymentStatus
    });
  }

  return next();
}
