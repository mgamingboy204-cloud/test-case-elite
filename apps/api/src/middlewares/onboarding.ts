import { NextFunction, Request, Response } from "express";

function onboardingRedirectForStep(step: string) {
  switch (step) {
    case "PHONE_VERIFIED":
    case "VIDEO_VERIFICATION_PENDING":
    case "VIDEO_VERIFIED":
      return "/onboarding/video-verification";
    case "PAYMENT_PENDING":
    case "PAID":
      return "/onboarding/payment";
    case "PROFILE_PENDING":
      return "/onboarding/profile";
    case "ACTIVE":
      return "/pwa_app/discover";
    default:
      return "/onboarding/video-verification";
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
