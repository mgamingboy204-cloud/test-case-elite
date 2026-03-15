import { Router } from "express";
import { z } from "zod";
import { ConsentSchema } from "@elite/shared";
import {
  listMatchesHandler,
  offlineMeetUnlockHandler,
  onlineMeetUnlockHandler,
  phoneUnlockHandler,
  respondConsentHandler,
  socialExchangeUnlockHandler,
  unmatchHandler
} from "../controllers/matchController";
import { requireAuth, requireAuthHeader } from "../middlewares/auth";
import { requireMatchingEligible } from "../middlewares/onboarding";
import { validateBody, validateParams } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/matches", requireAuth, requireMatchingEligible, asyncHandler(listMatchesHandler));
router.post(
  "/consent/respond",
  requireAuth,
  requireAuthHeader,
  requireMatchingEligible,
  validateBody(ConsentSchema),
  asyncHandler(respondConsentHandler)
);
router.get(
  "/phone-unlock/:matchId",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  asyncHandler(phoneUnlockHandler)
);
router.get(
  "/offline-meet/:matchId",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  asyncHandler(offlineMeetUnlockHandler)
);
router.get(
  "/online-meet/:matchId",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  asyncHandler(onlineMeetUnlockHandler)
);
router.get(
  "/social-exchange/:matchId",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  asyncHandler(socialExchangeUnlockHandler)
);
router.delete(
  "/matches/:matchId",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  asyncHandler(unmatchHandler)
);

export default router;
