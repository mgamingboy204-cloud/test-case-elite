import { prisma } from "../db/prisma";

export async function createReport(options: { reporterId: string; reportedUserId: string; reason: string; details?: string | null }) {
  return prisma.report.create({
    data: {
      reporterId: options.reporterId,
      reportedUserId: options.reportedUserId,
      reason: options.reason,
      details: options.details ?? null
    }
  });
}
