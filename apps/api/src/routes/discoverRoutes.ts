import { Router } from "express";
import { z } from "zod";
import { discoverFeed, discoverProfileDetail, discoverProfiles } from "../controllers/discoverController";
import { requireActive } from "../middlewares/onboarding";
import { requireAuth } from "../middlewares/auth";
import { validateQuery } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

const toOptionalNumber = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}, z.number().optional());

const DiscoverQuerySchema = z.object({
  city: z.string().optional(),
  page: toOptionalNumber,
  pageSize: toOptionalNumber
});

const DiscoverFeedQuerySchema = z.object({
  intent: z.string().optional(),
  city: z.string().optional(),
  distance: toOptionalNumber,
  cursor: z.string().optional(),
  limit: toOptionalNumber
});

router.get("/profiles", requireAuth, requireActive, validateQuery(DiscoverQuerySchema), asyncHandler(discoverProfiles));
router.get("/discover", requireAuth, requireActive, validateQuery(DiscoverFeedQuerySchema), asyncHandler(discoverFeed));
router.get("/discover/feed", requireAuth, requireActive, validateQuery(DiscoverFeedQuerySchema), asyncHandler(discoverFeed));
router.get("/profiles/:userId", requireAuth, requireActive, asyncHandler(discoverProfileDetail));

export default router;
