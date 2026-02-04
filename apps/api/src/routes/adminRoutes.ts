import { Router } from "express";
import { z } from "zod";
import {
  approveRefundHandler,
  approveUserHandler,
  banUserHandler,
  dashboardHandler,
  deactivateUserHandler,
  deleteUserHandler,
  denyRefundHandler,
  listRefundsHandler,
  listReportsHandler,
  listUsersHandler,
  listVerificationRequestsHandler,
  approveVerificationRequestHandler,
  rejectVerificationRequestHandler,
  rejectUserHandler,
  shiftPaymentDateHandler,
  startVerificationRequestHandler
} from "../controllers/adminController";
import { requireAdmin, requireAuth, requireAuthHeader } from "../middlewares/auth";
import { validateBody, validateParams } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.post(
  "/admin/users/:id/approve",
  requireAuth,
  requireAuthHeader,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(approveUserHandler)
);
router.post(
  "/admin/users/:id/reject",
  requireAuth,
  requireAuthHeader,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(rejectUserHandler)
);
router.post(
  "/admin/users/:id/ban",
  requireAuth,
  requireAuthHeader,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(banUserHandler)
);
router.get("/admin/users", requireAuth, requireAdmin, asyncHandler(listUsersHandler));
router.get("/admin/dashboard", requireAuth, requireAdmin, asyncHandler(dashboardHandler));
router.post(
  "/admin/users/:id/deactivate",
  requireAuth,
  requireAuthHeader,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(deactivateUserHandler)
);
router.post(
  "/admin/users/:id/delete",
  requireAuth,
  requireAuthHeader,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(deleteUserHandler)
);
router.get("/admin/reports", requireAuth, requireAdmin, asyncHandler(listReportsHandler));
router.get("/admin/refunds", requireAuth, requireAdmin, asyncHandler(listRefundsHandler));

router.post(
  "/admin/refunds/:id/approve",
  requireAuth,
  requireAuthHeader,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(approveRefundHandler)
);
router.post(
  "/admin/refunds/:id/deny",
  requireAuth,
  requireAuthHeader,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(denyRefundHandler)
);

router.get("/admin/verification-requests", requireAuth, requireAdmin, asyncHandler(listVerificationRequestsHandler));
router.post(
  "/admin/verification-requests/:id/start",
  requireAuth,
  requireAuthHeader,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  validateBody(z.object({ verificationLink: z.string().url() })),
  asyncHandler(startVerificationRequestHandler)
);
router.post(
  "/admin/verification-requests/:id/approve",
  requireAuth,
  requireAuthHeader,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(approveVerificationRequestHandler)
);
router.post(
  "/admin/verification-requests/:id/reject",
  requireAuth,
  requireAuthHeader,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(rejectVerificationRequestHandler)
);

router.post(
  "/admin/dev/shift-payment-date",
  requireAuth,
  requireAuthHeader,
  requireAdmin,
  validateBody(z.object({ userId: z.string().uuid(), daysBack: z.coerce.number().int().min(1) })),
  asyncHandler(shiftPaymentDateHandler)
);

export default router;
