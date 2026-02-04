import { Request, Response } from "express";

export async function healthHandler(req: Request, res: Response) {
  return res.json({ ok: true });
}
