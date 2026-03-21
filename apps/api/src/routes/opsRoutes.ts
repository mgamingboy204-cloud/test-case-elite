import { Router } from "express";
import { z } from "zod";
import {
  addCaseNoteHandler,
  adminAuditLogsHandler,
  adminEscalationsHandler,
  caseActivityHandler,
  employeeAssignedCasesHandler,
  employeeDashboardHandler,
  employeeEscalationsHandler
} from "../controllers/opsController";
import { requireAdmin, requireAuth, requireEmployee } from "../middlewares/auth";
import { validateBody, validateParams } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.get("/employee/dashboard", requireAuth, requireEmployee, asyncHandler(employeeDashboardHandler));
router.get("/employee/assigned-cases", requireAuth, requireEmployee, asyncHandler(employeeAssignedCasesHandler));
router.get("/employee/escalations", requireAuth, requireEmployee, asyncHandler(employeeEscalationsHandler));

router.get(
  "/ops/cases/:caseType/:caseId/activity",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseType: z.string().min(1), caseId: z.string().uuid() })),
  asyncHandler(caseActivityHandler)
);
router.post(
  "/ops/cases/:caseType/:caseId/notes",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseType: z.string().min(1), caseId: z.string().uuid() })),
  validateBody(z.object({ body: z.string().trim().min(1) })),
  asyncHandler(addCaseNoteHandler)
);

router.get("/admin/escalations", requireAuth, requireAdmin, asyncHandler(adminEscalationsHandler));
router.get("/admin/audit-logs", requireAuth, requireAdmin, asyncHandler(adminAuditLogsHandler));

export default router;
