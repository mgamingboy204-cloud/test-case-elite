import { Router } from "express";
import {
  listAlertsHandler,
  listNotificationsHandler,
  markAlertReadHandler,
  markAlertsReadAllHandler,
  markNotificationsReadHandler
} from "../controllers/notificationController";
import { requireAuth } from "../middlewares/auth";
import { requireActive } from "../middlewares/onboarding";
import { validateParams } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { z } from "zod";

const router = Router();

router.get("/notifications", requireAuth, requireActive, asyncHandler(listNotificationsHandler));
router.patch("/notifications/read", requireAuth, requireActive, asyncHandler(markNotificationsReadHandler));

// PRD alias routes
router.get("/alerts", requireAuth, requireActive, asyncHandler(listAlertsHandler));
router.post("/alerts/read-all", requireAuth, requireActive, asyncHandler(markAlertsReadAllHandler));
router.post(
  "/alerts/:alertId/read",
  requireAuth,
  requireActive,
  validateParams(z.object({ alertId: z.string().uuid() })),
  asyncHandler(markAlertReadHandler)
);

export default router;
