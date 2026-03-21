import { Request, Response } from "express";
import {
  addCaseNote,
  getEmployeeDashboard,
  listAdminAuditLogs,
  listAdminEscalations,
  listAssignedCases,
  listCaseActivity,
  listOperationalEscalations
} from "../services/opsService";

export async function employeeDashboardHandler(req: Request, res: Response) {
  const result = await getEmployeeDashboard(res.locals.user.id);
  return res.json(result);
}

export async function employeeAssignedCasesHandler(req: Request, res: Response) {
  const result = await listAssignedCases(res.locals.user.id);
  return res.json(result);
}

export async function employeeEscalationsHandler(_req: Request, res: Response) {
  const result = await listOperationalEscalations();
  return res.json(result);
}

export async function adminEscalationsHandler(_req: Request, res: Response) {
  const result = await listAdminEscalations();
  return res.json(result);
}

export async function adminAuditLogsHandler(req: Request, res: Response) {
  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
  const result = await listAdminAuditLogs(limit);
  return res.json(result);
}

export async function caseActivityHandler(req: Request, res: Response) {
  const result = await listCaseActivity(req.params.caseType, req.params.caseId);
  return res.json(result);
}

export async function addCaseNoteHandler(req: Request, res: Response) {
  const { body } = req.body as { body: string };
  const result = await addCaseNote({
    actorUserId: res.locals.user.id,
    caseType: req.params.caseType,
    caseId: req.params.caseId,
    body
  });
  return res.json(result);
}
