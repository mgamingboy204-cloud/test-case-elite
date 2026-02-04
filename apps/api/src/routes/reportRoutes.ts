import { Router } from "express";
import { ReportSchema } from "@elite/shared";
import { createReportHandler } from "../controllers/reportController";
import { requireAuth, requireAuthHeader } from "../middlewares/auth";
import { requireActive } from "../middlewares/onboarding";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/reports",
  requireAuth,
  requireAuthHeader,
  requireActive,
  validateBody(ReportSchema),
  asyncHandler(createReportHandler)
);

export default router;
