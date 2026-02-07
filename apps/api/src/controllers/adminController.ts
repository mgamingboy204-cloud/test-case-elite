import { Request, Response } from "express";
import { env } from "../config/env";
import {
  approveRefund,
  approveUser,
  banUser,
  deactivateUser,
  deleteUser,
  denyRefund,
  getDashboard,
  listRefunds,
  listReports,
  listUsers,
  listVerificationRequests,
  approveVerificationRequest,
  rejectVerificationRequest,
  rejectUser,
  approveVerificationForUser,
  rejectVerificationForUser,
  setVerificationMeetLink,
  startVerificationRequest,
  shiftPaymentDate
} from "../services/adminService";

export async function approveUserHandler(req: Request, res: Response) {
  const result = await approveUser(req.params.id, res.locals.user.id);
  return res.json(result);
}

export async function rejectUserHandler(req: Request, res: Response) {
  const result = await rejectUser(req.params.id, res.locals.user.id);
  return res.json(result);
}

export async function banUserHandler(req: Request, res: Response) {
  const result = await banUser(req.params.id, res.locals.user.id);
  return res.json(result);
}

export async function listUsersHandler(req: Request, res: Response) {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const result = await listUsers(status);
  return res.json(result);
}

export async function dashboardHandler(req: Request, res: Response) {
  const result = await getDashboard();
  return res.json(result);
}

export async function deactivateUserHandler(req: Request, res: Response) {
  const result = await deactivateUser(req.params.id);
  return res.json(result);
}

export async function deleteUserHandler(req: Request, res: Response) {
  const result = await deleteUser(req.params.id);
  return res.json(result);
}

export async function listReportsHandler(req: Request, res: Response) {
  const result = await listReports();
  return res.json(result);
}

export async function listRefundsHandler(req: Request, res: Response) {
  const result = await listRefunds();
  return res.json(result);
}

export async function approveRefundHandler(req: Request, res: Response) {
  const result = await approveRefund(req.params.id, res.locals.user.id);
  return res.json(result);
}

export async function denyRefundHandler(req: Request, res: Response) {
  const result = await denyRefund(req.params.id, res.locals.user.id);
  return res.json(result);
}

export async function listVerificationRequestsHandler(req: Request, res: Response) {
  const statusFilter = typeof req.query.status === "string" ? req.query.status : undefined;
  const result = await listVerificationRequests(statusFilter);
  return res.json(result);
}

export async function startVerificationRequestHandler(req: Request, res: Response) {
  const { meetUrl } = req.body as { meetUrl: string };
  const result = await startVerificationRequest(req.params.id, meetUrl, res.locals.user.id);
  return res.json(result);
}

export async function approveVerificationRequestHandler(req: Request, res: Response) {
  const result = await approveVerificationRequest(req.params.id, res.locals.user.id);
  return res.json(result);
}

export async function rejectVerificationRequestHandler(req: Request, res: Response) {
  const { reason } = req.body as { reason: string };
  const result = await rejectVerificationRequest(req.params.id, res.locals.user.id, reason);
  return res.json(result);
}

export async function setVerificationMeetLinkHandler(req: Request, res: Response) {
  const { meetUrl } = req.body as { meetUrl: string };
  const result = await setVerificationMeetLink(req.params.userId, meetUrl, res.locals.user.id);
  return res.json(result);
}

export async function approveVerificationForUserHandler(req: Request, res: Response) {
  const { reason } = req.body as { reason?: string };
  const result = await approveVerificationForUser(req.params.userId, res.locals.user.id, reason);
  return res.json(result);
}

export async function rejectVerificationForUserHandler(req: Request, res: Response) {
  const { reason } = req.body as { reason: string };
  const result = await rejectVerificationForUser(req.params.userId, res.locals.user.id, reason);
  return res.json(result);
}

export async function shiftPaymentDateHandler(req: Request, res: Response) {
  if (env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not allowed" });
  }
  const { userId, daysBack } = req.body as { userId: string; daysBack: number };
  const result = await shiftPaymentDate({ userId, daysBack });
  return res.json(result);
}
