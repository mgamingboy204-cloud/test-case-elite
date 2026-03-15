import { NextFunction, Request, Response } from "express";

function onboardingRedirectForStep(step: string) {
  switch (step) {
    case "PHONE_VERIFIED":
    case "VIDEO_VERIFICATION_PENDING":
      return "/onboarding/verification";
    case "VIDEO_VERIFIED":
    case "PAYMENT_PENDING":
      return "/onboarding/payment";
    case "PAID":
    case "PROFILE_PENDING":
      return "/onboarding/profile";
    case "ACTIVE":
      return "/discover";
    default:
      return "/onboarding/verification";
  }
}

export function requireActive(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;
  if (user.onboardingStep !== "ACTIVE") {
    const redirectTo = onboardingRedirectForStep(user.onboardingStep);
    return res.status(403).json({
      message: "Onboarding incomplete",
      currentStep: user.onboardingStep,
      requiredStep: "ACTIVE",
      redirectTo
    });
  }
  return next();
}
