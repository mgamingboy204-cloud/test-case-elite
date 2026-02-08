import { Request, Response } from "express";
import { getDiscoverFeed, getDiscoverProfileDetail, getDiscoverProfiles } from "../services/discoverService";

export async function discoverProfiles(req: Request, res: Response) {
  const { gender, city, minAge, maxAge, page, pageSize, mode } = req.query as Record<string, string | number | undefined>;
  const result = await getDiscoverProfiles({
    userId: res.locals.user.id,
    gender: typeof gender === "string" ? gender : undefined,
    city: typeof city === "string" ? city : undefined,
    minAge: typeof minAge === "number" ? minAge : undefined,
    maxAge: typeof maxAge === "number" ? maxAge : undefined,
    page: typeof page === "number" ? page : undefined,
    pageSize: typeof pageSize === "number" ? pageSize : undefined,
    mode: typeof mode === "string" ? mode : undefined
  });
  return res.json(result);
}

export async function discoverFeed(req: Request, res: Response) {
  const { gender, city, minAge, maxAge, cursor, limit, mode, intent } = req.query as Record<
    string,
    string | number | undefined
  >;
  const result = await getDiscoverFeed({
    userId: res.locals.user.id,
    gender: typeof gender === "string" ? gender : undefined,
    city: typeof city === "string" ? city : undefined,
    minAge: typeof minAge === "number" ? minAge : undefined,
    maxAge: typeof maxAge === "number" ? maxAge : undefined,
    cursor: typeof cursor === "string" ? cursor : undefined,
    limit: typeof limit === "number" ? limit : undefined,
    mode: typeof mode === "string" ? mode : undefined,
    intent: typeof intent === "string" ? intent : undefined
  });
  return res.json(result);
}

export async function discoverProfileDetail(req: Request, res: Response) {
  const targetUserId = req.params.userId;
  const profile = await getDiscoverProfileDetail({
    userId: res.locals.user.id,
    targetUserId
  });
  if (!profile) {
    return res.status(404).json({ message: "Profile not found" });
  }
  return res.json({ profile });
}
