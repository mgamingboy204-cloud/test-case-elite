import { Router } from "express";
import { PartialProfileSchema, ProfileSchema } from "@elite/shared";
import { completeProfileHandler, getProfileHandler, patchProfileHandler, updateProfileHandler } from "../controllers/profileController";
import { requireAuth, requireAuthHeader } from "../middlewares/auth";
import { validateBody } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/profile", requireAuth, asyncHandler(getProfileHandler));
router.put("/profile", requireAuth, requireAuthHeader, validateBody(ProfileSchema), asyncHandler(updateProfileHandler));
router.patch("/profile", requireAuth, requireAuthHeader, validateBody(PartialProfileSchema), asyncHandler(patchProfileHandler));
router.post("/profile/complete", requireAuth, requireAuthHeader, asyncHandler(completeProfileHandler));

export default router;
