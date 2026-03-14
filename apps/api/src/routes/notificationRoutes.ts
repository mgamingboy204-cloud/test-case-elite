import { Router } from "express";
import { z } from "zod";
import { listNotificationsHandler, markNotificationReadHandler } from "../controllers/notificationController";
import { requireAuth } from "../middlewares/auth";
import { validateParams } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/notifications", requireAuth, asyncHandler(listNotificationsHandler));
router.patch(
  "/notifications/:notificationId/read",
  requireAuth,
  validateParams(z.object({ notificationId: z.string().uuid() })),
  asyncHandler(markNotificationReadHandler)
);

export default router;
