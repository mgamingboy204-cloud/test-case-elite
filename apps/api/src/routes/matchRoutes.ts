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
import { respondConsent, unmatch } from "../services/matchService";
import { createSocialExchangeRequest, respondToSocialExchangeRequest } from "../services/socialExchangeService";
import { getOfflineMeetCaseForUserHandler, submitOfflineMeetSelectionsHandler } from "../controllers/offlineMeetController";
import { getOnlineMeetCaseForUserHandler, submitOnlineMeetSelectionsHandler } from "../controllers/onlineMeetController";
import {
  createSocialExchangeRequestHandler,
  listSocialExchangeCasesHandler,
  openSocialRevealHandler,
  respondToSocialExchangeRequestHandler,
  submitSocialHandleHandler
} from "../controllers/socialExchangeController";
import { requireAuth } from "../middlewares/auth";
import { requireMatchingEligible } from "../middlewares/onboarding";
import { validateBody, validateParams } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// PRD alias endpoints (thin wrappers over the current consent/case implementation).
// These do not change existing routes used by the current frontend.

const InteractionTypeSchema = z.enum(["OFFLINE_MEET", "ONLINE_MEET", "SOCIAL_EXCHANGE", "PHONE_EXCHANGE"]);
const InteractionRequestSchema = z.object({
  type: InteractionTypeSchema
});

const InteractionRespondSchema = z.object({
  action: z.enum(["ACCEPT", "REJECT"])
});

function toConsentInteractionId(matchId: string, type: Exclude<z.infer<typeof InteractionTypeSchema>, "SOCIAL_EXCHANGE">) {
  // Deterministic id for consent-backed interactions.
  return `${matchId}:${type}`;
}

function toSocialCaseInteractionId(caseId: string) {
  // Social exchange is backed by a SocialExchangeCase, not consent.
  return `socialcase:${caseId}`;
}

function parseInteractionId(
  interactionId: string
):
  | { kind: "social"; caseId: string }
  | { kind: "consent"; matchId: string; type: Exclude<z.infer<typeof InteractionTypeSchema>, "SOCIAL_EXCHANGE"> } {
  if (interactionId.startsWith("socialcase:")) {
    const caseId = interactionId.slice("socialcase:".length);
    if (!caseId) throw new Error("Invalid interactionId");
    return { kind: "social", caseId };
  }

  const idx = interactionId.lastIndexOf(":");
  if (idx <= 0) throw new Error("Invalid interactionId");
  const matchId = interactionId.slice(0, idx);
  const type = interactionId.slice(idx + 1) as z.infer<typeof InteractionTypeSchema>;
  if (type === "SOCIAL_EXCHANGE") throw new Error("Invalid interactionId");
  return { kind: "consent", matchId, type: type as Exclude<z.infer<typeof InteractionTypeSchema>, "SOCIAL_EXCHANGE"> };
}

router.get("/matches", requireAuth, requireMatchingEligible, asyncHandler(listMatchesHandler));
router.post(
  "/consent/respond",
  requireAuth,
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
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  asyncHandler(createSocialExchangeRequestHandler)
);

router.post(
  "/social-exchange-cases/:caseId/respond",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(SocialExchangeRespondSchema),
  asyncHandler(respondToSocialExchangeRequestHandler)
);

router.post(
  "/social-exchange-cases/:caseId/handle",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(SocialExchangeHandleSchema),
  asyncHandler(submitSocialHandleHandler)
);

router.post(
  "/social-exchange-cases/:caseId/reveal",
  requireAuth,
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

// POST /api/matches/:matchId/unmatch (PRD alias)
router.post(
  "/matches/:matchId/unmatch",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  asyncHandler(async (req, res) => {
    const { matchId } = req.params as { matchId: string };
    await unmatch({ matchId, userId: req.user!.id });
    return res.json({ unmatched: true });
  })
);

// POST /api/matches/:matchId/interactions (PRD alias)
router.post(
  "/matches/:matchId/interactions",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ matchId: z.string() })),
  validateBody(InteractionRequestSchema),
  asyncHandler(async (req, res) => {
    const { matchId } = req.params as { matchId: string };
    const { type } = req.body as { type: z.infer<typeof InteractionTypeSchema> };

    // Social Exchange uses a separate case flow (socialExchangeCase).
    if (type === "SOCIAL_EXCHANGE") {
      const result = await createSocialExchangeRequest({ matchId, userId: req.user!.id });
      // New PRD interaction id backed by the socialExchangeCase id.
      return res.json({
        interactionId: toSocialCaseInteractionId(result.socialExchange.id),
        status: "PENDING_ACCEPTANCE"
      });
    }

    // Map PRD interaction types to internal consent types.
    const consentType =
      type === "PHONE_EXCHANGE" ? "PHONE_NUMBER" : (type as "OFFLINE_MEET" | "ONLINE_MEET" | "SOCIAL_EXCHANGE");

    // For PRD "requesting an interaction", we treat it as requester consent = YES.
    const response = await respondConsent({
      matchId,
      userId: req.user!.id,
      response: "YES",
      type: consentType,
      payload: null
    });

    const ready = Boolean((response as any)?.ready);
    const status = ready ? "ACCEPTED" : "PENDING_ACCEPTANCE";

    return res.json({
      interactionId: toConsentInteractionId(matchId, type),
      status
    });
  })
);

// POST /api/interactions/:interactionId/respond (PRD alias)
router.post(
  "/interactions/:interactionId/respond",
  requireAuth,
  requireMatchingEligible,
  validateParams(z.object({ interactionId: z.string() })),
  validateBody(InteractionRespondSchema),
  asyncHandler(async (req, res) => {
    const { interactionId } = req.params as { interactionId: string };
    const { action } = req.body as { action: "ACCEPT" | "REJECT" };

    let parsed:
      | { kind: "social"; caseId: string }
      | { kind: "consent"; matchId: string; type: Exclude<z.infer<typeof InteractionTypeSchema>, "SOCIAL_EXCHANGE"> };
    try {
      parsed = parseInteractionId(interactionId);
    } catch {
      return res.status(400).json({ message: "Invalid interactionId" });
    }

    if (parsed.kind === "social") {
      await respondToSocialExchangeRequest({
        caseId: parsed.caseId,
        userId: req.user!.id,
        response: action === "ACCEPT" ? "ACCEPT" : "REJECT"
      });
    } else {
      const consentType =
        parsed.type === "PHONE_EXCHANGE"
          ? "PHONE_NUMBER"
          : (parsed.type as "OFFLINE_MEET" | "ONLINE_MEET" | "SOCIAL_EXCHANGE");

      await respondConsent({
        matchId: parsed.matchId,
        userId: req.user!.id,
        response: action === "ACCEPT" ? "YES" : "NO",
        type: consentType,
        payload: null
      });
    }

    // PRD response is simplified: ACCEPT => ACCEPTED, REJECT => REJECTED.
    const status = action === "ACCEPT" ? "ACCEPTED" : "REJECTED";
    return res.json({ status });
  })
);

export default router;
