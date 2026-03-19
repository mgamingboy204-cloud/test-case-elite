import { Request, Response } from "express";
import { getDiscoverFeed, getDiscoverProfileDetail, getDiscoverProfiles } from "../services/discoverService";

export async function discoverProfiles(req: Request, res: Response) {
  const { city, page, pageSize } = req.query as Record<string, string | number | undefined>;
  const result = await getDiscoverProfiles({
    userId: req.user!.id,
    city: typeof city === "string" ? city : undefined,
    page: typeof page === "number" ? page : undefined,
    pageSize: typeof pageSize === "number" ? pageSize : undefined,
    baseUrl: `${req.protocol}://${req.get("host")}`
  });
  return res.json(result);
}

export async function discoverFeed(req: Request, res: Response) {
  const { city, cursor, limit, intent, age } = req.query as Record<
    string,
    string | number | undefined
  >;
  res.setHeader("Cache-Control", "private, max-age=15, stale-while-revalidate=45");
  const result = await getDiscoverFeed({
    userId: req.user!.id,
    city: typeof city === "string" ? city : undefined,
    cursor: typeof cursor === "string" ? cursor : undefined,
    limit: typeof limit === "number" ? limit : undefined,
    intent: typeof intent === "string" ? intent : undefined,
    minAge: typeof age === "number" ? age : undefined,
    baseUrl: `${req.protocol}://${req.get("host")}`
  });
  return res.json(result);
}

export async function discoverProfileDetail(req: Request, res: Response) {
  const targetUserId = req.params.userId;
  const profile = await getDiscoverProfileDetail({
    userId: req.user!.id,
    targetUserId,
    baseUrl: `${req.protocol}://${req.get("host")}`
  });
  if (!profile) {
    return res.status(404).json({ message: "Profile not found" });
  }
  return res.json({ profile });
}
