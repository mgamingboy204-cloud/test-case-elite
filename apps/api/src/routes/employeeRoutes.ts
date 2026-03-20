import { Router } from "express";
import { requireAuth } from "../middlewares/auth";
import { requireEmployeeOnly } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { listEmployeeMembersHandler } from "../controllers/employeeController";

const router = Router();

// PRD: my members
router.get(
  "/employee/members",
  requireAuth,
  requireEmployeeOnly,
  asyncHandler(listEmployeeMembersHandler)
);

export default router;

