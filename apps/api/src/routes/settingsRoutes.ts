import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { updateNotificationsEnabledHandler } from "../controllers/settingsController";

const router = Router();

router.post(
  "/settings/notifications",
  requireAuth,
  validateBody(z.object({ enabled: z.boolean() })),
  asyncHandler(updateNotificationsEnabledHandler)
);

export default router;

