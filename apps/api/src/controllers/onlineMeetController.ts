import { Request, Response } from "express";
import {
  assignOnlineMeetCase,
  finalizeOnlineMeetCase,
  getOnlineMeetCaseForUser,
  listOnlineMeetCasesForEmployee,
  markOnlineMeetNoOverlap,
  markOnlineMeetTimeout,
  sendOnlineMeetOptions,
  submitOnlineMeetSelections,
  updateOnlineMeetCancelOrReschedule
} from "../services/onlineMeetService";

export async function getOnlineMeetCaseForUserHandler(req: Request, res: Response) {
  const { matchId } = req.params as { matchId: string };
  const result = await getOnlineMeetCaseForUser(matchId, res.locals.user.id);
  return res.json(result);
}

export async function submitOnlineMeetSelectionsHandler(req: Request, res: Response) {
  const { matchId } = req.params as { matchId: string };
  const { platform, timeSlots } = req.body as { platform: "ZOOM" | "GOOGLE_MEET"; timeSlots: string[] };
  const result = await submitOnlineMeetSelections({ matchId, userId: res.locals.user.id, platform, timeSlots });
  return res.json(result);
}

export async function listOnlineMeetCasesHandler(req: Request, res: Response) {
  const statusView = typeof req.query.statusView === "string" ? req.query.statusView : undefined;
  const result = await listOnlineMeetCasesForEmployee(res.locals.user.id, statusView);
  return res.json(result);
}

export async function assignOnlineMeetCaseHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const result = await assignOnlineMeetCase(caseId, res.locals.user.id);
  return res.json(result);
}

export async function sendOnlineMeetOptionsHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const { platforms, timeSlots } = req.body as {
    platforms: Array<"ZOOM" | "GOOGLE_MEET">;
    timeSlots: Array<{ id: string; label: string; startsAtIso?: string | null }>;
  };
  const result = await sendOnlineMeetOptions({ caseId, employeeUserId: res.locals.user.id, platforms, timeSlots: timeSlots.map((entry) => ({ ...entry, startsAtIso: entry.startsAtIso ?? null })) });
  return res.json(result);
}

export async function finalizeOnlineMeetCaseHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const { finalPlatform, finalTimeSlotId, finalMeetingLink } = req.body as { finalPlatform: "ZOOM" | "GOOGLE_MEET"; finalTimeSlotId: string; finalMeetingLink: string };
  const result = await finalizeOnlineMeetCase({ caseId, employeeUserId: res.locals.user.id, finalPlatform, finalTimeSlotId, finalMeetingLink });
  return res.json(result);
}

export async function markOnlineMeetTimeoutHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const { nonResponderUserId } = req.body as { nonResponderUserId: string };
  const result = await markOnlineMeetTimeout({ caseId, employeeUserId: res.locals.user.id, nonResponderUserId });
  return res.json(result);
}

export async function markOnlineMeetNoOverlapHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const result = await markOnlineMeetNoOverlap({ caseId, employeeUserId: res.locals.user.id });
  return res.json(result);
}

export async function updateOnlineMeetCancelOrRescheduleHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const { action, reason, requestedByUserId } = req.body as { action: "CANCEL" | "RESCHEDULE"; reason: string; requestedByUserId?: string | null };
  const result = await updateOnlineMeetCancelOrReschedule({ caseId, employeeUserId: res.locals.user.id, action, reason, requestedByUserId });
  return res.json(result);
}
