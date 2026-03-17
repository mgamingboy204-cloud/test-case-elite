import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { deleteMyAccountHandler, updateNotificationsHandler } from "../controllers/userController";

const router = Router();

router.delete("/account", requireAuth, asyncHandler(deleteMyAccountHandler));
router.delete("/users/account", requireAuth, asyncHandler(deleteMyAccountHandler));
router.delete("/api/users/account", requireAuth, asyncHandler(deleteMyAccountHandler));

router.post("/settings/notifications", requireAuth, asyncHandler(updateNotificationsHandler));
router.post("/api/settings/notifications", requireAuth, asyncHandler(updateNotificationsHandler));

export default router;
