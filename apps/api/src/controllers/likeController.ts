import { Request, Response } from "express";
import { HttpError } from "../utils/httpErrors";
import { logger } from "../utils/logger";
import { createLike, getIncomingLikes } from "../services/likeService";

function getRequestId(req: Request) {
  const headerRequestId = req.get("x-request-id");
  if (headerRequestId) return headerRequestId;
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getAuthenticatedUserId(req: Request, res: Response) {
  return req.user?.id ?? req.user?.userId ?? res.locals.user?.id ?? req.userId ?? null;
}

export async function createLikeHandler(req: Request, res: Response) {
  const requestId = getRequestId(req);
  const userId = getAuthenticatedUserId(req, res);
  const hasAuthenticatedUser = Boolean(userId);

  const { toUserId, type } = req.body as { toUserId?: string; type?: "LIKE" | "PASS" };

  if (!userId) {
    logger.warn("likes.create.unauthenticated", { requestId, hasAuthenticatedUser, toUserId, type, statusCode: 401 });
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  if (!toUserId || (type !== "LIKE" && type !== "PASS")) {
    logger.warn("likes.create.invalid_payload", { requestId, hasAuthenticatedUser, userId, toUserId, type, statusCode: 400 });
    return res.status(400).json({ error: "INVALID_LIKE_PAYLOAD", message: "toUserId and type are required." });
  }

  if (toUserId === userId) {
    logger.warn("likes.create.self_action", { requestId, hasAuthenticatedUser, userId, toUserId, type, statusCode: 400 });
    throw new HttpError(400, { message: "Cannot act on yourself." });
  }

  const result = await createLike({
    fromUserId: userId,
    toUserId,
    type
  });

  logger.info("likes.create.success", { requestId, hasAuthenticatedUser, userId, toUserId, type, statusCode: 200, matchId: result.matchId ?? null });
  return res.json({ ok: true, matchId: result.matchId });
}

export async function incomingLikesHandler(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  const result = await getIncomingLikes(userId);
  return res.json(result);
}
