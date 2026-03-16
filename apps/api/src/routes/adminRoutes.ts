import { Router } from "express";
import { z } from "zod";
import {
  approveRefundHandler,
  assignVerificationRequestHandler,
  approveUserHandler,
  banUserHandler,
  dashboardHandler,
  employeeWorkloadsHandler,
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
import { requireAdmin, requireAuth, requireEmployee } from "../middlewares/auth";
import { validateBody, validateParams } from "../middlewares/validate";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// Meet validation schemas
const meetUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((url) => /^https:\/\/meet\.google\.com\/.+/.test(url), {
    message: "Meet link must start with https://meet.google.com/ and include a meeting path."
  });

// Offline meet schemas
const OfflineMeetOptionsSchema = z.object({
  cafeOptions: z.array(z.object({
    name: z.string(),
    address: z.string(),
    area: z.string()
  })),
  timeSlotOptions: z.array(z.object({
    date: z.string(),
    times: z.array(z.string())
  }))
});

const OfflineMeetFinalizeSchema = z.object({
  finalCafe: z.object({
    name: z.string(),
    address: z.string(),
    area: z.string()
  }),
  finalTimeSlot: z.object({
    date: z.string(),
    time: z.string()
  })
});

const OfflineMeetNoResponseSchema = z.object({
  timeoutUserId: z.string()
});

const OfflineMeetAdminCancelSchema = z.object({
  cancelReason: z.string(),
  canceledByUserId: z.string()
});

// Online meet schemas
const OnlineMeetOptionsSchema = z.object({
  platformOptions: z.array(z.enum(["ZOOM", "GOOGLE_MEET"])),
  timeSlotOptions: z.array(z.object({
    date: z.string(),
    times: z.array(z.string())
  }))
});

const OnlineMeetFinalizeSchema = z.object({
  finalPlatform: z.enum(["ZOOM", "GOOGLE_MEET"]),
  finalTimeSlot: z.object({
    date: z.string(),
    time: z.string()
  }),
  finalMeetingLink: z.string().url()
});

const OnlineMeetNoResponseSchema = z.object({
  timeoutUserId: z.string()
});

const OnlineMeetAdminCancelSchema = z.object({
  cancelReason: z.string(),
  canceledByUserId: z.string()
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
router.get("/admin/employees/workloads", requireAuth, requireAdmin, asyncHandler(employeeWorkloadsHandler));
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

router.get("/admin/verification-requests", requireAuth, requireEmployee, asyncHandler(listVerificationRequestsHandler));
router.post(
  "/admin/verification-requests/:requestId/assign",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ requestId: z.string().uuid() })),
  validateBody(z.object({ meetUrl: meetUrlSchema })),
  asyncHandler(assignVerificationRequestHandler)
);
router.post(
  "/admin/verification-requests/:requestId/approve",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ requestId: z.string().uuid() })),
  validateBody(z.object({ reason: z.string().min(1).nullish() })),
  asyncHandler(approveVerificationRequestHandler)
);
router.post(
  "/admin/verification-requests/:requestId/reject",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ requestId: z.string().uuid() })),
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



router.get("/admin/offline-meets", requireAuth, requireEmployee, asyncHandler(listOfflineMeetCasesHandler));
router.post(
  "/admin/offline-meets/:caseId/assign",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseId: z.string().uuid() })),
  asyncHandler(assignOfflineMeetCaseHandler)
);
router.post(
  "/admin/offline-meets/:caseId/options",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OfflineMeetOptionsSchema),
  asyncHandler(sendOfflineMeetOptionsHandler)
);
router.post(
  "/admin/offline-meets/:caseId/finalize",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OfflineMeetFinalizeSchema),
  asyncHandler(finalizeOfflineMeetCaseHandler)
);
router.post(
  "/admin/offline-meets/:caseId/timeout",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OfflineMeetNoResponseSchema),
  asyncHandler(markOfflineMeetTimeoutHandler)
);
router.post(
  "/admin/offline-meets/:caseId/no-overlap",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseId: z.string().uuid() })),
  asyncHandler(markOfflineMeetNoOverlapHandler)
);
router.post(
  "/admin/offline-meets/:caseId/case-update",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OfflineMeetAdminCancelSchema),
  asyncHandler(updateOfflineMeetCancelOrRescheduleHandler)
);



router.get("/admin/online-meets", requireAuth, requireEmployee, asyncHandler(listOnlineMeetCasesHandler));
router.post(
  "/admin/online-meets/:caseId/assign",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseId: z.string().uuid() })),
  asyncHandler(assignOnlineMeetCaseHandler)
);
router.post(
  "/admin/online-meets/:caseId/options",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OnlineMeetOptionsSchema),
  asyncHandler(sendOnlineMeetOptionsHandler)
);
router.post(
  "/admin/online-meets/:caseId/finalize",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OnlineMeetFinalizeSchema),
  asyncHandler(finalizeOnlineMeetCaseHandler)
);
router.post(
  "/admin/online-meets/:caseId/timeout",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OnlineMeetNoResponseSchema),
  asyncHandler(markOnlineMeetTimeoutHandler)
);
router.post(
  "/admin/online-meets/:caseId/no-overlap",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseId: z.string().uuid() })),
  asyncHandler(markOnlineMeetNoOverlapHandler)
);
router.post(
  "/admin/online-meets/:caseId/case-update",
  requireAuth,
  requireEmployee,
  validateParams(z.object({ caseId: z.string().uuid() })),
  validateBody(OnlineMeetAdminCancelSchema),
  asyncHandler(updateOnlineMeetCancelOrRescheduleHandler)
);

export default router;
