import { Router } from "express";
import { listNotificationsHandler } from "../controllers/notificationController";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/notifications", requireAuth, asyncHandler(listNotificationsHandler));

export default router;
