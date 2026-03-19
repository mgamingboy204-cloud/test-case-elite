import { Router } from "express";
import { whoAmI } from "../controllers/authController";
import { deleteMyAccountHandler, upsertFcmTokenHandler } from "../controllers/userController";
import { requireAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { z } from "zod";

const router = Router();

router.get("/me", requireAuth, asyncHandler(whoAmI));
router.delete("/account", requireAuth, asyncHandler(deleteMyAccountHandler));
// PRD compatibility alias: DELETE /api/users/account { confirmation: "DELETE" }
router.delete("/users/account", requireAuth, asyncHandler(deleteMyAccountHandler));
router.post(
  "/users/fcm-token",
  requireAuth,
  validateBody(z.object({ token: z.string().min(10).max(2048) })),
  asyncHandler(upsertFcmTokenHandler)
);

export default router;
