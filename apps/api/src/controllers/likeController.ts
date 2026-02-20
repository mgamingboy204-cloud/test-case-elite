import { Request, Response } from "express";
import { HttpError } from "../utils/httpErrors";
import { createLike, getIncomingLikes } from "../services/likeService";

export async function createLikeHandler(req: Request, res: Response) {
  const { toUserId, type } = req.body as { toUserId: string; type: "LIKE" | "PASS" };
  if (toUserId === res.locals.user.id) {
    throw new HttpError(400, { message: "Cannot act on yourself." });
  }
  const result = await createLike({
    fromUserId: res.locals.user.id,
    toUserId,
    type
  });
  return res.json({ ok: true, matchId: result.matchId });
}

export async function incomingLikesHandler(req: Request, res: Response) {
  const result = await getIncomingLikes(res.locals.user.id);
  return res.json(result);
}
