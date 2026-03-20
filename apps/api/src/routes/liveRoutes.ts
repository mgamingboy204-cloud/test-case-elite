import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { registerLiveConnection } from "../live/liveEventBroker";

const router = Router();

router.get("/events/stream", requireAuth, (req, res) => {
  const user = res.locals.user;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.socket?.setKeepAlive(true);
  res.socket?.setNoDelay(true);

  registerLiveConnection({
    userId: user.id,
    role: user.role ?? null,
    isAdmin: Boolean(user.isAdmin),
    res
  });
});

export default router;
