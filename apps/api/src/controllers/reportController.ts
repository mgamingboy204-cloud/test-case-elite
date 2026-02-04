import { Request, Response } from "express";
import { createReport } from "../services/reportService";

export async function createReportHandler(req: Request, res: Response) {
  const { reportedUserId, reason, details } = req.body as {
    reportedUserId: string;
    reason: string;
    details?: string | null;
  };
  const report = await createReport({
    reporterId: res.locals.user.id,
    reportedUserId,
    reason,
    details
  });
  return res.json(report);
}
