import { Router } from "express";
import { z } from "zod";
import { OfflineMeetAdminCancelSchema, OfflineMeetFinalizeSchema, OfflineMeetNoResponseSchema, OfflineMeetOptionsSchema, OnlineMeetAdminCancelSchema, OnlineMeetFinalizeSchema, OnlineMeetNoResponseSchema, OnlineMeetOptionsSchema } from "@elite/shared";
import {
  approveRefundHandler,
  assignVerificationRequestHandler,
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
  approveVerificationForUserHandler,
  rejectVerificationForUserHandler,
  setVerificationMeetLinkHandler,
  shiftPaymentDateHandler,
  startVerificationRequestHandler
} from "../controllers/adminController";
import {
  assignOfflineMeetCaseHandler,
  finalizeOfflineMeetCaseHandler,
  listOfflineMeetCasesHandler,
  markOfflineMeetNoOverlapHandler,
  markOfflineMeetTimeoutHandler,
  sendOfflineMeetOptionsHandler,
  updateOfflineMeetCancelOrRescheduleHandler
} from "../controllers/offlineMeetController";
import {
  assignOnlineMeetCaseHandler,
  finalizeOnlineMeetCaseHandler,
  listOnlineMeetCasesHandler,
  markOnlineMeetNoOverlapHandler,
  markOnlineMeetTimeoutHandler,
  sendOnlineMeetOptionsHandler,
  updateOnlineMeetCancelOrRescheduleHandler
} from "../controllers/onlineMeetController";
import { requireAdmin, requireAuth } from "../middlewares/auth";
import { validateBody, validateParams } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
const meetUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((url) => /^https:\/\/meet\.google\.com\/.+/.test(url), {
    message: "Meet link must start with https://meet.google.com/ and include a meeting path."
  });

router.post(
  "/admin/users/:id/approve",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(approveUserHandler)
);
router.post(
  "/admin/users/:id/reject",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(rejectUserHandler)
);
router.post(
  "/admin/users/:id/ban",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(banUserHandler)
);
router.get("/admin/users", requireAuth, requireAdmin, asyncHandler(listUsersHandler));
router.get("/admin/dashboard", requireAuth, requireAdmin, asyncHandler(dashboardHandler));
router.post(
  "/admin/users/:id/deactivate",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(deactivateUserHandler)
);
router.post(
  "/admin/users/:id/delete",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(deleteUserHandler)
);
router.get("/admin/reports", requireAuth, requireAdmin, asyncHandler(listReportsHandler));
router.get("/admin/refunds", requireAuth, requireAdmin, asyncHandler(listRefundsHandler));

router.post(
  "/admin/refunds/:id/approve",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(approveRefundHandler)
);
router.post(
  "/admin/refunds/:id/deny",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(denyRefundHandler)
);

router.get("/admin/verification-requests", requireAuth, requireAdmin, asyncHandler(listVerificationRequestsHandler));
router.post(
  "/admin/verification-requests/:id/assign",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(assignVerificationRequestHandler)
);
router.post(
  "/admin/verification-requests/:id/start",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  validateBody(z.object({ meetUrl: meetUrlSchema })),
  asyncHandler(startVerificationRequestHandler)
);
router.post(
  "/admin/verification-requests/:id/approve",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  asyncHandler(approveVerificationRequestHandler)
);
router.post(
  "/admin/verification-requests/:id/reject",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ id: z.string() })),
  validateBody(z.object({ reason: z.string().min(1) })),
  asyncHandler(rejectVerificationRequestHandler)
);

router.post(
  "/admin/verifications/:userId/meet-link",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ userId: z.string() })),
  validateBody(z.object({ meetUrl: meetUrlSchema })),
  asyncHandler(setVerificationMeetLinkHandler)
);
router.post(
  "/admin/verifications/:userId/approve",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ userId: z.string() })),
  validateBody(z.object({ reason: z.string().min(1).nullish() })),
  asyncHandler(approveVerificationForUserHandler)
);
router.post(
  "/admin/verifications/:userId/reject",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ userId: z.string() })),
  validateBody(z.object({ reason: z.string().min(1) })),
  asyncHandler(rejectVerificationForUserHandler)
);

router.post(
  "/admin/dev/shift-payment-date",
  requireAuth,
  requireAdmin,
  validateBody(z.object({ userId: z.string().uuid(), daysBack: z.coerce.number().int().min(1) })),
  asyncHandler(shiftPaymentDateHandler)
);



router.get("/admin/offline-meets", requireAuth, requireAdmin, asyncHandler(listOfflineMeetCasesHandler));
router.post(
  "/admin/offline-meets/:caseId/assign",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ caseId: z.string().uuid() })),
  asyncHandler(assignOfflineMeetCaseHandler)
);
router.post(
  "/admin/offline-meets/:caseId/options",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OfflineMeetOptionsSchema),
  asyncHandler(sendOfflineMeetOptionsHandler)
);
router.post(
  "/admin/offline-meets/:caseId/finalize",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OfflineMeetFinalizeSchema),
  asyncHandler(finalizeOfflineMeetCaseHandler)
);
router.post(
  "/admin/offline-meets/:caseId/timeout",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OfflineMeetNoResponseSchema),
  asyncHandler(markOfflineMeetTimeoutHandler)
);
router.post(
  "/admin/offline-meets/:caseId/no-overlap",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ caseId: z.string().uuid() })),
  asyncHandler(markOfflineMeetNoOverlapHandler)
);
router.post(
  "/admin/offline-meets/:caseId/case-update",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OfflineMeetAdminCancelSchema),
  asyncHandler(updateOfflineMeetCancelOrRescheduleHandler)
);



router.get("/admin/online-meets", requireAuth, requireAdmin, asyncHandler(listOnlineMeetCasesHandler));
router.post(
  "/admin/online-meets/:caseId/assign",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ caseId: z.string().uuid() })),
  asyncHandler(assignOnlineMeetCaseHandler)
);
router.post(
  "/admin/online-meets/:caseId/options",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OnlineMeetOptionsSchema),
  asyncHandler(sendOnlineMeetOptionsHandler)
);
router.post(
  "/admin/online-meets/:caseId/finalize",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OnlineMeetFinalizeSchema),
  asyncHandler(finalizeOnlineMeetCaseHandler)
);
router.post(
  "/admin/online-meets/:caseId/timeout",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OnlineMeetNoResponseSchema),
  asyncHandler(markOnlineMeetTimeoutHandler)
);
router.post(
  "/admin/online-meets/:caseId/no-overlap",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ caseId: z.string().uuid() })),
  asyncHandler(markOnlineMeetNoOverlapHandler)
);
router.post(
  "/admin/online-meets/:caseId/case-update",
  requireAuth,
  requireAdmin,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OnlineMeetAdminCancelSchema),
  asyncHandler(updateOnlineMeetCancelOrRescheduleHandler)
);

export default router;
