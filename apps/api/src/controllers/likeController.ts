import { Request, Response } from "express";
import { HttpError } from "../utils/httpErrors";
import { createLike, getIncomingLikes, rewindLastLike } from "../services/likeService";

export async function createLikeHandler(req: Request, res: Response) {
  if (!res.locals.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
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

export async function rewindLikeHandler(req: Request, res: Response) {
  const result = await rewindLastLike(res.locals.user.id);
  if (!result.rewoundProfileId) {
    throw new HttpError(404, { message: "No swipe action available to rewind." });
  }
  return res.json({ ok: true, rewoundProfileId: result.rewoundProfileId });
}
