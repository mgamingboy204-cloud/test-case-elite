import { Router } from "express";
import { listNotificationsHandler, markNotificationsReadHandler } from "../controllers/notificationController";
import { requireAuth } from "../middlewares/auth";
import { requireActive } from "../middlewares/onboarding";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/notifications", requireAuth, requireActive, asyncHandler(listNotificationsHandler));
router.patch("/notifications/read", requireAuth, requireActive, asyncHandler(markNotificationsReadHandler));

export default router;
