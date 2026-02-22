import { Request, Response } from "express";
import { HttpError } from "../utils/httpErrors";
import { logger } from "../utils/logger";
import { createLike, getIncomingLikes, getOutgoingLikes } from "../services/likeService";

function getRequestId(req: Request, res: Response) {
  return (res.locals.requestId as string | undefined) ?? req.get("x-request-id") ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}


export async function createLikeHandler(req: Request, res: Response) {
  const requestId = getRequestId(req, res);
  const userId = req.user?.id ?? null;
  const hasAuthenticatedUser = Boolean(userId);

  const { actionId, targetUserId, action } = req.body as { actionId?: string; targetUserId?: string; action?: "LIKE" | "PASS" };
  if (process.env.LIKES_DEBUG_LOGS === "1") {
    logger.info("likes.handler.entry", {
      requestId,
      marker: "likes_handler_v3",
      hasAuthenticatedUser,
      reqUserPresent: Boolean(req.user),
      reqUserId: req.user?.id ?? null,
      actionId: actionId ?? null
    });
  }

  if (!userId) {
    logger.warn("likes.create.unauthenticated", { requestId, marker: "likes_handler_v3", hasAuthenticatedUser, actionId, targetUserId, action, statusCode: 401 });
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  if (!actionId || !targetUserId || (action !== "LIKE" && action !== "PASS")) {
    logger.warn("likes.create.invalid_payload", { requestId, hasAuthenticatedUser, userId, actionId, targetUserId, action, statusCode: 400 });
    return res.status(400).json({ error: "INVALID_LIKE_PAYLOAD", message: "actionId, targetUserId and action are required." });
  }

  if (targetUserId === userId) {
    logger.warn("likes.create.self_action", { requestId, hasAuthenticatedUser, userId, targetUserId, action, statusCode: 400 });
    throw new HttpError(400, { message: "Cannot act on yourself." });
  }

  const result = await createLike({
    actionId,
    actorUserId: userId,
    targetUserId,
    action
  });

  logger.info("likes.create.success", { requestId, marker: "likes_handler_v3", hasAuthenticatedUser, userId, actionId, targetUserId, action, statusCode: 200, deduplicated: result.deduplicated, matchId: result.matchId ?? null });
  return res.json({ ok: true, matchId: result.matchId, alreadyProcessed: result.deduplicated });
}

export async function incomingLikesHandler(req: Request, res: Response) {
  const userId = req.user?.id ?? null;
  if (!userId) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  const result = await getIncomingLikes(userId);
  return res.json(result);
}

export async function outgoingLikesHandler(req: Request, res: Response) {
  const userId = req.user?.id ?? null;
  if (!userId) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  const result = await getOutgoingLikes(userId);
  return res.json(result);
}
