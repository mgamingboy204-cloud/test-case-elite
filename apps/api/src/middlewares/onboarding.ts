import { NextFunction, Request, Response } from "express";
import { resolveUserAppState } from "@vael/shared";

function sendStateError(res: Response, status: number, state: ReturnType<typeof resolveUserAppState>, message: string) {
  return res.status(status).json({
    code: state.code,
    message,
    redirectTo: state.redirectTo,
    onboardingStep: state.onboardingStep,
    reasons: state.reasons,
    matchingEligible: state.matchingEligible
  });
}

export function requireActive(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;

  const state = resolveUserAppState({
    isAuthenticated: Boolean(user),
    onboardingStep: user?.onboardingStep,
    videoVerificationStatus: user?.videoVerificationStatus,
    paymentStatus: user?.paymentStatus,
    profileCompletedAt: user?.profileCompletedAt,
    subscriptionEndsAt: user?.subscriptionEndsAt,
    userStatus: user?.status,
    photoCount: user?.photoCount ?? 0
  });

  if (state.code === "guest") {
    return sendStateError(res, 401, state, "Authentication required");
  }

  if (state.onboardingStep !== "ACTIVE") {
    return sendStateError(res, 403, state, "Onboarding incomplete");
  }

  return next();
}

export function requireMatchingEligible(req: Request, res: Response, next: NextFunction) {
  const user = res.locals.user;

  const state = resolveUserAppState({
    isAuthenticated: Boolean(user),
    onboardingStep: user?.onboardingStep,
    videoVerificationStatus: user?.videoVerificationStatus,
    paymentStatus: user?.paymentStatus,
    profileCompletedAt: user?.profileCompletedAt,
    subscriptionEndsAt: user?.subscriptionEndsAt,
    userStatus: user?.status,
    photoCount: user?.photoCount ?? 0
  });

  if (state.code === "guest") {
    return sendStateError(res, 401, state, "Authentication required");
  }

  if (!state.matchingEligible) {
    return sendStateError(res, 403, state, "Account not eligible for matching");
  }

  return next();
}
