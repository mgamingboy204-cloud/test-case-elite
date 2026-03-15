import { Router } from "express";
import { z } from "zod";
import { ConsentSchema, OfflineMeetSelectionSchema, OnlineMeetSelectionSchema, SocialExchangeHandleSchema, SocialExchangeRespondSchema } from "@vael/shared";
import {
  listMatchesHandler,
  offlineMeetUnlockHandler,
  onlineMeetUnlockHandler,
  phoneUnlockHandler,
  respondConsentHandler,
  socialExchangeUnlockHandler,
  unmatchHandler
} from "../controllers/matchController";
import { getOfflineMeetCaseForUserHandler, submitOfflineMeetSelectionsHandler } from "../controllers/offlineMeetController";
import { getOnlineMeetCaseForUserHandler, submitOnlineMeetSelectionsHandler } from "../controllers/onlineMeetController";
import {
  createSocialExchangeRequestHandler,
  listSocialExchangeCasesHandler,
  openSocialRevealHandler,
  respondToSocialExchangeRequestHandler,
  submitSocialHandleHandler
} from "../controllers/socialExchangeController";
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

router.get(
  "/social-exchange-cases/:matchId",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  asyncHandler(listSocialExchangeCasesHandler)
);

router.post(
  "/social-exchange-cases/:matchId/request",
  requireAuth,
  requireAuthHeader,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  asyncHandler(createSocialExchangeRequestHandler)
);

router.post(
  "/social-exchange-cases/:caseId/respond",
  requireAuth,
  requireAuthHeader,
  requireMatchingEligible,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(SocialExchangeRespondSchema),
  asyncHandler(respondToSocialExchangeRequestHandler)
);

router.post(
  "/social-exchange-cases/:caseId/handle",
  requireAuth,
  requireAuthHeader,
  requireMatchingEligible,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(SocialExchangeHandleSchema),
  asyncHandler(submitSocialHandleHandler)
);

router.post(
  "/social-exchange-cases/:caseId/reveal",
  requireAuth,
  requireAuthHeader,
  requireMatchingEligible,
  validateParams(z.object({ caseId: z.string().uuid() })),
  asyncHandler(openSocialRevealHandler)
);

router.get(
  "/offline-meet-cases/:matchId",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  asyncHandler(getOfflineMeetCaseForUserHandler)
);
router.post(
  "/offline-meet-cases/:matchId/selections",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  validateBody(OfflineMeetSelectionSchema),
  asyncHandler(submitOfflineMeetSelectionsHandler)
);


router.get(
  "/online-meet-cases/:matchId",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  asyncHandler(getOnlineMeetCaseForUserHandler)
);
router.post(
  "/online-meet-cases/:matchId/selections",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  validateBody(OnlineMeetSelectionSchema),
  asyncHandler(submitOnlineMeetSelectionsHandler)
);

router.delete(
  "/matches/:matchId",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  asyncHandler(unmatchHandler)
);

export default router;
