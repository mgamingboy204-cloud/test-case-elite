import { z } from "zod";
import { Router } from "express";
import {
  deleteOwnAccountHandler,
  getAccountPreferencesHandler,
  updateAccountPreferencesHandler
} from "../controllers/accountController";
import { requireAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const PreferenceSchema = z.object({
  theme: z.enum(["light", "dark"]).optional()
});

const router = Router();

router.get("/account/preferences", requireAuth, asyncHandler(getAccountPreferencesHandler));
router.patch(
  "/account/preferences",
  requireAuth,
  validateBody(PreferenceSchema),
  asyncHandler(updateAccountPreferencesHandler)
);
router.delete("/account", requireAuth, asyncHandler(deleteOwnAccountHandler));

export default router;
