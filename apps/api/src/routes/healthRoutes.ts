import { Router } from "express";
import { healthHandler } from "../controllers/healthController";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/", (_req, res) => {
  return res.json({ ok: true });
});
router.get("/health", asyncHandler(healthHandler));
router.get("/_version", (req, res) => {
  return res.json({
    ok: true,
    commit: process.env.RENDER_GIT_COMMIT ?? process.env.GIT_COMMIT ?? "unknown",
    versionMarker: "api-likes-fix-v3"
  });
});
router.get("/_debug/auth", requireAuth, (req, res) => {
  return res.json({ ok: true, hasUser: Boolean(req.user), userId: req.user?.id ?? null });
});

export default router;
