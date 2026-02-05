import { Router } from "express";
import { z } from "zod";
import { discoverProfileDetail, discoverProfiles } from "../controllers/discoverController";
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
  gender: z.string().optional(),
  city: z.string().optional(),
  minAge: toOptionalNumber,
  maxAge: toOptionalNumber,
  page: toOptionalNumber,
  pageSize: toOptionalNumber,
  mode: z.string().optional()
});

router.get("/profiles", requireAuth, requireActive, validateQuery(DiscoverQuerySchema), asyncHandler(discoverProfiles));
router.get("/profiles/:userId", requireAuth, requireActive, asyncHandler(discoverProfileDetail));

export default router;
