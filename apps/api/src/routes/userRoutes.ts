import { Router } from "express";
import { whoAmI } from "../controllers/authController";
import { deleteMyAccountHandler } from "../controllers/userController";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/me", requireAuth, asyncHandler(whoAmI));
router.delete("/account", requireAuth, asyncHandler(deleteMyAccountHandler));

export default router;
