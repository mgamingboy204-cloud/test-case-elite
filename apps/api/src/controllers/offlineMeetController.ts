import { Request, Response } from "express";
import {
  assignOfflineMeetCase,
  finalizeOfflineMeetCase,
  getOfflineMeetCaseForUser,
  listOfflineMeetCasesForEmployee,
  markOfflineMeetNoOverlap,
  markOfflineMeetTimeout,
  sendOfflineMeetOptions,
  submitOfflineMeetSelections,
  updateOfflineMeetCancelOrReschedule
} from "../services/offlineMeetService";

export async function getOfflineMeetCaseForUserHandler(req: Request, res: Response) {
  const { matchId } = req.params as { matchId: string };
  const result = await getOfflineMeetCaseForUser(matchId, res.locals.user.id);
  return res.json(result);
}

export async function submitOfflineMeetSelectionsHandler(req: Request, res: Response) {
  const { matchId } = req.params as { matchId: string };
  const { cafes, timeSlots } = req.body as { cafes: string[]; timeSlots: string[] };
  const result = await submitOfflineMeetSelections({ matchId, userId: res.locals.user.id, cafes, timeSlots });
  return res.json(result);
}

export async function listOfflineMeetCasesHandler(req: Request, res: Response) {
  const result = await listOfflineMeetCasesForEmployee(res.locals.user.id);
  return res.json(result);
}

export async function assignOfflineMeetCaseHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const result = await assignOfflineMeetCase(caseId, res.locals.user.id);
  return res.json(result);
}

export async function sendOfflineMeetOptionsHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const { cafes, timeSlots } = req.body as { cafes: Array<{ id: string; name: string; address: string }>; timeSlots: Array<{ id: string; label: string; startsAtIso?: string | null }> };
  const result = await sendOfflineMeetOptions({ caseId, employeeUserId: res.locals.user.id, cafes, timeSlots });
  return res.json(result);
}

export async function finalizeOfflineMeetCaseHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const { finalCafeId, finalTimeSlotId } = req.body as { finalCafeId: string; finalTimeSlotId: string };
  const result = await finalizeOfflineMeetCase({ caseId, employeeUserId: res.locals.user.id, finalCafeId, finalTimeSlotId });
  return res.json(result);
}

export async function markOfflineMeetTimeoutHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const { nonResponderUserId } = req.body as { nonResponderUserId: string };
  const result = await markOfflineMeetTimeout({ caseId, employeeUserId: res.locals.user.id, nonResponderUserId });
  return res.json(result);
}

export async function markOfflineMeetNoOverlapHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const result = await markOfflineMeetNoOverlap({ caseId, employeeUserId: res.locals.user.id });
  return res.json(result);
}

export async function updateOfflineMeetCancelOrRescheduleHandler(req: Request, res: Response) {
  const { caseId } = req.params as { caseId: string };
  const { action, reason, requestedByUserId } = req.body as { action: "CANCEL" | "RESCHEDULE"; reason: string; requestedByUserId?: string | null };
  const result = await updateOfflineMeetCancelOrReschedule({ caseId, employeeUserId: res.locals.user.id, action, reason, requestedByUserId });
  return res.json(result);
}
