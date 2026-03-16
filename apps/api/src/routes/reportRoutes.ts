import { Router } from "express";
import { ReportSchema } from "@vael/shared";
import { createReportHandler } from "../controllers/reportController";
import { requireAuth } from "../middlewares/auth";
import { requireActive } from "../middlewares/onboarding";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/reports",
  requireAuth,
  requireActive,
  validateBody(ReportSchema),
  asyncHandler(createReportHandler)
);

export default router;
