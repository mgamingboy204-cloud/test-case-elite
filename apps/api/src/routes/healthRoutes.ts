import { Router } from "express";
import { healthHandler } from "../controllers/healthController";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/health", asyncHandler(healthHandler));

export default router;
