import { Router } from "express";
import { whoAmI } from "../controllers/authController";
import { deleteMyAccountHandler, upsertFcmTokenHandler } from "../controllers/userController";
import { requireAuth } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { z } from "zod";

const router = Router();

const DeleteAccountSchema = z.object({
  confirmation: z.literal("DELETE").describe("Must be exactly 'DELETE' to confirm account deletion")
});

router.get("/me", requireAuth, asyncHandler(whoAmI));
router.delete(
  "/account",
  requireAuth,
  validateBody(DeleteAccountSchema),
  asyncHandler(deleteMyAccountHandler)
);
// PRD compatibility alias: DELETE /api/users/account { confirmation: "DELETE" }
router.delete(
  "/users/account",
  requireAuth,
  validateBody(DeleteAccountSchema),
  asyncHandler(deleteMyAccountHandler)
);
router.post(
  "/users/fcm-token",
  requireAuth,
  validateBody(z.object({ token: z.string().min(10).max(2048) })),
  asyncHandler(upsertFcmTokenHandler)
);

export default router;
