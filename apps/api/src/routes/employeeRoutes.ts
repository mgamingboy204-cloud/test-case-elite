import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middlewares/auth";
import { requireEmployeeOnly } from "../middlewares/auth";
import { validateBody, validateParams } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";
import {
  assignEmployeeVerificationHandler,
  employeeSendMeetLinkHandler,
  employeeVerificationResultHandler,
  listEmployeeInteractionsHandler,
  listEmployeeMembersHandler,
  listEmployeePendingVerificationHandler
} from "../controllers/employeeController";

const router = Router();

const verificationIdParam = z.object({ verificationId: z.string().uuid() });

// PRD: Employee verification queue (pending only)
router.get(
  "/employee/verification",
  requireAuth,
  requireEmployeeOnly,
  asyncHandler(listEmployeePendingVerificationHandler)
);

// PRD: assign
router.post(
  "/employee/verification/:verificationId/assign",
  requireAuth,
  requireEmployeeOnly,
  validateParams(verificationIdParam),
  asyncHandler(assignEmployeeVerificationHandler)
);

// PRD: send meet link
const sendMeetLinkSchema = z.object({ meetLink: z.string().min(5) });
router.post(
  "/employee/verification/:verificationId/send-meet-link",
  requireAuth,
  requireEmployeeOnly,
  validateParams(verificationIdParam),
  validateBody(sendMeetLinkSchema),
  asyncHandler(employeeSendMeetLinkHandler)
);

// PRD: result
const verificationResultSchema = z.object({
  result: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().optional()
});
router.post(
  "/employee/verification/:verificationId/result",
  requireAuth,
  requireEmployeeOnly,
  validateParams(verificationIdParam),
  validateBody(verificationResultSchema),
  asyncHandler(employeeVerificationResultHandler)
);

// PRD: interactions list
const employeeInteractionsQuerySchema = z.object({
  type: z.enum(["OFFLINE_MEET", "ONLINE_MEET", "ALL"]).optional(),
  status: z.enum(["ACCEPTED"]).optional()
});
router.get(
  "/employee/interactions",
  requireAuth,
  requireEmployeeOnly,
  asyncHandler(async (req, res) => {
    const parsed = employeeInteractionsQuerySchema.safeParse(req.query);
    if (!parsed.success) return res.status(400).json({ message: "Invalid query" });
    return listEmployeeInteractionsHandler(req, res);
  })
);

// PRD: my members
router.get(
  "/employee/members",
  requireAuth,
  requireEmployeeOnly,
  asyncHandler(listEmployeeMembersHandler)
);

export default router;

