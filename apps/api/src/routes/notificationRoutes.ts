import { Router } from "express";
import { listNotificationsHandler, markNotificationsReadHandler } from "../controllers/notificationController";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/notifications", requireAuth, asyncHandler(listNotificationsHandler));
router.patch("/notifications/read", requireAuth, asyncHandler(markNotificationsReadHandler));

export default router;
