import { Request, Response } from "express";
import { HttpError } from "../utils/httpErrors";
import { createLike, getIncomingLikes } from "../services/likeService";

function getAuthenticatedUserId(req: Request, res: Response) {
  return res.locals.user?.id ?? req.userId ?? null;
}

export async function createLikeHandler(req: Request, res: Response) {
  const userId = getAuthenticatedUserId(req, res);
  if (!userId) {
    return res.status(401).json({ error: "UNAUTHENTICATED" });
  }

  const { toUserId, type } = req.body as { toUserId: string; type: "LIKE" | "PASS" };
  if (toUserId === userId) {
    throw new HttpError(400, { message: "Cannot act on yourself." });
  }
  const result = await createLike({
    fromUserId: userId,
    toUserId,
    type
  });
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
