import { NextFunction, Request, Response } from "express";
import { onboardingRedirectForBackendStep } from "@elite/shared";

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
