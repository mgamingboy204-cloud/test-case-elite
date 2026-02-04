import { Request, Response } from "express";
import { getDiscoverProfiles } from "../services/discoverService";

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
