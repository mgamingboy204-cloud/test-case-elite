import { Router } from "express";
import { devWhoAmI, whoAmI } from "../controllers/authController";
import { requireAuth } from "../middlewares/auth";
import { env } from "../config/env";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/me", requireAuth, asyncHandler(whoAmI));

if (env.NODE_ENV === "development") {
  router.get("/dev/whoami", asyncHandler(devWhoAmI));
}

export default router;
