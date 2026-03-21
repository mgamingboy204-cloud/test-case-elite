import bcrypt from "bcrypt";
import crypto from "crypto";
import {
  OfflineMeetCoordinationStatus,
  OnlineMeetCoordinationStatus,
  Role,
  VerificationRequestStatus
} from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";
import {
  emitAdminAuditLogsChanged,
  emitAdminDashboardChanged,
  emitAdminStaffChanged,
  emitOpsCaseActivityChanged
} from "../live/liveEventBroker";

const WHATSAPP_HELP_PREFIX = "WHATSAPP_HELP_REQUESTED:";
const ACTIVE_VERIFICATION_STATUSES: VerificationRequestStatus[] = ["REQUESTED", "ASSIGNED", "IN_PROGRESS"];
const ACTIVE_OFFLINE_STATUSES: OfflineMeetCoordinationStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "EMPLOYEE_PREPARING_OPTIONS",
  "OPTIONS_SENT",
  "AWAITING_USER_SELECTIONS",
  "USER_ONE_RESPONDED",
  "USER_TWO_RESPONDED",
  "READY_FOR_FINALIZATION",
  "RESCHEDULE_REQUESTED"
];
const ACTIVE_ONLINE_STATUSES: OnlineMeetCoordinationStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "EMPLOYEE_PREPARING_OPTIONS",
  "OPTIONS_SENT",
  "AWAITING_USER_SELECTIONS",
  "USER_ONE_RESPONDED",
  "USER_TWO_RESPONDED",
  "READY_FOR_FINALIZATION",
  "RESCHEDULE_REQUESTED"
];

const CASE_TYPE_TARGET_MAP = {
  VERIFICATION: "VerificationRequest",
  OFFLINE_MEET: "OfflineMeetCase",
  ONLINE_MEET: "OnlineMeetCase"
} as const;

type OpsCaseType = keyof typeof CASE_TYPE_TARGET_MAP;

function normalizeCaseType(value: string): OpsCaseType {
  const normalized = value.trim().toUpperCase();
  if (normalized === "VERIFICATION") return "VERIFICATION";
  if (normalized === "OFFLINE_MEET") return "OFFLINE_MEET";
  if (normalized === "ONLINE_MEET") return "ONLINE_MEET";
  throw new HttpError(400, { message: "Invalid case type." });
}

function formatUserName(user: {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
}) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.displayName || "Staff";
}

function formatMemberName(user: {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  profile?: { name: string | null } | null;
}) {
  return user.profile?.name ?? ([user.firstName, user.lastName].filter(Boolean).join(" ") || user.displayName || "Member");
}

function randomTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  return Array.from(crypto.randomBytes(12))
    .map((byte) => alphabet[byte % alphabet.length])
    .join("");
}

async function generateEmployeeId(role: "ADMIN" | "EMPLOYEE") {
  const prefix = role === "ADMIN" ? "VAEL-ADM" : "VAEL-EMP";

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const suffix = crypto.randomInt(1000, 9999);
    const employeeId = `${prefix}-${suffix}`;
    const existing = await prisma.user.findUnique({
      where: { employeeId },
      select: { id: true }
    });
    if (!existing) return employeeId;
  }

  throw new HttpError(500, { message: "Unable to generate a staff employee ID. Please try again." });
}

async function assertCaseExists(caseType: OpsCaseType, caseId: string) {
  if (caseType === "VERIFICATION") {
    const request = await prisma.verificationRequest.findUnique({
      where: { id: caseId },
      select: { id: true }
    });
    if (!request) throw new HttpError(404, { message: "Verification request not found." });
    return;
  }

  if (caseType === "OFFLINE_MEET") {
    const caseItem = await prisma.offlineMeetCase.findUnique({
      where: { id: caseId },
      select: { id: true }
    });
    if (!caseItem) throw new HttpError(404, { message: "Offline meet case not found." });
    return;
  }

  const caseItem = await prisma.onlineMeetCase.findUnique({
    where: { id: caseId },
    select: { id: true }
  });
  if (!caseItem) throw new HttpError(404, { message: "Online meet case not found." });
}

export async function getEmployeeDashboard(actorUserId: string) {
  const [pendingVerificationRequests, myVerificationCases, myOfflineCases, myOnlineCases, memberLoad, escalations] = await Promise.all([
    prisma.verificationRequest.count({
      where: { status: "REQUESTED", assignedEmployeeId: null }
    }),
    prisma.verificationRequest.count({
      where: {
        assignedEmployeeId: actorUserId,
        status: { in: ACTIVE_VERIFICATION_STATUSES }
      }
    }),
    prisma.offlineMeetCase.count({
      where: {
        assignedEmployeeId: actorUserId,
        status: { in: ACTIVE_OFFLINE_STATUSES }
      }
    }),
    prisma.onlineMeetCase.count({
      where: {
        assignedEmployeeId: actorUserId,
        status: { in: ACTIVE_ONLINE_STATUSES }
      }
    }),
    prisma.user.count({
      where: {
        assignedEmployeeId: actorUserId,
        deletedAt: null,
        deactivatedAt: null
      }
    }),
    prisma.verificationRequest.count({
      where: {
        reason: { startsWith: WHATSAPP_HELP_PREFIX },
        status: { in: ACTIVE_VERIFICATION_STATUSES }
      }
    })
  ]);

  return {
    pendingVerificationRequests,
    myVerificationCases,
    myOfflineCases,
    myOnlineCases,
    assignedMembers: memberLoad,
    openEscalations: escalations,
    totalOwnedCases: myVerificationCases + myOfflineCases + myOnlineCases
  };
}

export async function listAssignedCases(actorUserId: string) {
  const [verification, offline, online] = await Promise.all([
    prisma.verificationRequest.findMany({
      where: {
        assignedEmployeeId: actorUserId,
        status: { in: ACTIVE_VERIFICATION_STATUSES }
      },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
            firstName: true,
            lastName: true,
            displayName: true
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.offlineMeetCase.findMany({
      where: {
        assignedEmployeeId: actorUserId,
        status: { in: ACTIVE_OFFLINE_STATUSES }
      },
      include: {
        match: {
          include: {
            userA: { include: { profile: true } },
            userB: { include: { profile: true } }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.onlineMeetCase.findMany({
      where: {
        assignedEmployeeId: actorUserId,
        status: { in: ACTIVE_ONLINE_STATUSES }
      },
      include: {
        match: {
          include: {
            userA: { include: { profile: true } },
            userB: { include: { profile: true } }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  return {
    cases: [
      ...verification.map((request) => ({
        id: request.id,
        caseType: "VERIFICATION" as const,
        status: request.status,
        assignedAt: request.assignedAt?.toISOString() ?? null,
        updatedAt: request.updatedAt.toISOString(),
        deskRoute: "/employee/verification",
        summary: `${request.user.phone}${request.user.email ? ` • ${request.user.email}` : ""}`,
        participants: [
          {
            id: request.user.id,
            name: formatMemberName(request.user)
          }
        ]
      })),
      ...offline.map((caseItem) => ({
        id: caseItem.id,
        caseType: "OFFLINE_MEET" as const,
        status: caseItem.status,
        assignedAt: caseItem.updatedAt.toISOString(),
        updatedAt: caseItem.updatedAt.toISOString(),
        deskRoute: "/employee/matches",
        summary: "Offline meet coordination",
        participants: [
          {
            id: caseItem.match.userA.id,
            name: formatMemberName(caseItem.match.userA)
          },
          {
            id: caseItem.match.userB.id,
            name: formatMemberName(caseItem.match.userB)
          }
        ]
      })),
      ...online.map((caseItem) => ({
        id: caseItem.id,
        caseType: "ONLINE_MEET" as const,
        status: caseItem.status,
        assignedAt: caseItem.updatedAt.toISOString(),
        updatedAt: caseItem.updatedAt.toISOString(),
        deskRoute: "/employee/matches",
        summary: "Online meet coordination",
        participants: [
          {
            id: caseItem.match.userA.id,
            name: formatMemberName(caseItem.match.userA)
          },
          {
            id: caseItem.match.userB.id,
            name: formatMemberName(caseItem.match.userB)
          }
        ]
      }))
    ].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  };
}

export async function listOperationalEscalations() {
  const requests = await prisma.verificationRequest.findMany({
    where: {
      reason: { startsWith: WHATSAPP_HELP_PREFIX }
    },
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          displayName: true
        }
      }
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  return {
    escalations: requests.map((request) => ({
      id: request.id,
      type: "VERIFICATION_WHATSAPP" as const,
      status: request.status,
      requestedAt: request.reason?.replace(WHATSAPP_HELP_PREFIX, "") ?? request.updatedAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
      assignedEmployeeId: request.assignedEmployeeId,
      member: {
        id: request.user.id,
        name: formatMemberName(request.user),
        phone: request.user.phone,
        email: request.user.email
      }
    }))
  };
}

export async function listAdminEscalations() {
  const [verificationEscalations, reports, refunds] = await Promise.all([
    listOperationalEscalations(),
    prisma.report.findMany({
      where: { status: "OPEN" },
      include: {
        reporter: { select: { id: true, phone: true, firstName: true, lastName: true, displayName: true } },
        reportedUser: { select: { id: true, phone: true, firstName: true, lastName: true, displayName: true } }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.refundRequest.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { id: true, phone: true, email: true, firstName: true, lastName: true, displayName: true } }
      },
      orderBy: { requestedAt: "desc" },
      take: 100
    })
  ]);

  return {
    verification: verificationEscalations.escalations,
    reports: reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      details: report.details,
      createdAt: report.createdAt.toISOString(),
      reporter: {
        id: report.reporter.id,
        name: formatMemberName(report.reporter),
        phone: report.reporter.phone
      },
      reportedUser: {
        id: report.reportedUser.id,
        name: formatMemberName(report.reportedUser),
        phone: report.reportedUser.phone
      }
    })),
    refunds: refunds.map((refund) => ({
      id: refund.id,
      requestedAt: refund.requestedAt.toISOString(),
      eligibleAt: refund.eligibleAt.toISOString(),
      member: {
        id: refund.user.id,
        name: formatMemberName(refund.user),
        phone: refund.user.phone,
        email: refund.user.email
      },
      reason: refund.reason
    }))
  };
}

export async function listAdminAuditLogs(limit = 100) {
  const logs = await prisma.auditLog.findMany({
    take: Math.max(1, Math.min(limit, 200)),
    orderBy: { createdAt: "desc" },
    include: {
      actor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          role: true,
          employeeId: true
        }
      }
    }
  });

  return {
    logs: logs.map((entry) => ({
      id: entry.id,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      metadata: entry.metadata,
      createdAt: entry.createdAt.toISOString(),
      actor: entry.actor
        ? {
            id: entry.actor.id,
            name: formatUserName(entry.actor),
            role: entry.actor.role,
            employeeId: entry.actor.employeeId
          }
        : null
    }))
  };
}

export async function listStaffMembers() {
  const staff = await prisma.user.findMany({
    where: {
      role: { in: ["EMPLOYEE", "ADMIN"] },
      deletedAt: null
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      displayName: true,
      phone: true,
      email: true,
      role: true,
      isAdmin: true,
      mustResetPassword: true,
      deactivatedAt: true,
      createdAt: true,
      lastActiveAt: true
    }
  });

  return {
    staff: staff.map((member) => ({
      id: member.id,
      employeeId: member.employeeId,
      name: formatUserName(member),
      phone: member.phone,
      email: member.email,
      role: member.role,
      isAdmin: member.isAdmin,
      mustResetPassword: member.mustResetPassword,
      isActive: member.deactivatedAt === null,
      createdAt: member.createdAt.toISOString(),
      lastActiveAt: member.lastActiveAt.toISOString()
    }))
  };
}

export async function createStaffMember(options: {
  actorUserId: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName?: string | null;
  phone: string;
  email?: string | null;
  role: "ADMIN" | "EMPLOYEE";
}) {
  const phone = options.phone.trim();
  const email = options.email?.trim() || null;
  const employeeId = await generateEmployeeId(options.role);
  const temporaryPassword = randomTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);
  const now = new Date();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { phone },
        ...(email ? [{ email }] : [])
      ]
    },
    select: { id: true }
  });
  if (existing) {
    throw new HttpError(409, { message: "A user with this phone or email already exists." });
  }

  const staff = await prisma.user.create({
    data: {
      phone,
      email,
      firstName: options.firstName?.trim() || null,
      lastName: options.lastName?.trim() || null,
      displayName: options.displayName?.trim() || null,
      passwordHash,
      role: options.role as Role,
      isAdmin: options.role === "ADMIN",
      employeeId,
      mustResetPassword: true,
      status: "APPROVED",
      verifiedAt: now,
      phoneVerifiedAt: now,
      onboardingStep: "ACTIVE",
      videoVerificationStatus: "APPROVED",
      paymentStatus: "PAID",
      profileCompletedAt: now
    }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: options.actorUserId,
      action: "staff_created",
      targetType: "User",
      targetId: staff.id,
      metadata: {
        role: staff.role,
        employeeId: staff.employeeId
      }
    }
  });

  emitAdminStaffChanged();
  emitAdminAuditLogsChanged();
  emitAdminDashboardChanged();

  return {
    staff: {
      id: staff.id,
      employeeId: staff.employeeId,
      role: staff.role,
      email: staff.email,
      phone: staff.phone,
      mustResetPassword: staff.mustResetPassword
    },
    temporaryPassword
  };
}

export async function setStaffActivation(options: {
  actorUserId: string;
  staffUserId: string;
  active: boolean;
}) {
  const staff = await prisma.user.findUnique({
    where: { id: options.staffUserId },
    select: { id: true, role: true, deletedAt: true }
  });
  if (!staff || staff.deletedAt) {
    throw new HttpError(404, { message: "Staff user not found." });
  }
  if (staff.role !== "EMPLOYEE" && staff.role !== "ADMIN") {
    throw new HttpError(400, { message: "Only staff accounts can be managed here." });
  }

  const updated = await prisma.user.update({
    where: { id: options.staffUserId },
    data: {
      deactivatedAt: options.active ? null : new Date()
    },
    select: {
      id: true,
      deactivatedAt: true
    }
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: options.actorUserId,
      action: options.active ? "staff_reactivated" : "staff_deactivated",
      targetType: "User",
      targetId: updated.id,
      metadata: {}
    }
  });

  emitAdminStaffChanged();
  emitAdminAuditLogsChanged();
  emitAdminDashboardChanged();

  return {
    id: updated.id,
    active: updated.deactivatedAt === null
  };
}

export async function listCaseActivity(caseTypeInput: string, caseId: string) {
  const caseType = normalizeCaseType(caseTypeInput);
  await assertCaseExists(caseType, caseId);

  const logs = await prisma.auditLog.findMany({
    where: {
      targetType: CASE_TYPE_TARGET_MAP[caseType],
      targetId: caseId
    },
    include: {
      actor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          displayName: true,
          role: true,
          employeeId: true
        }
      }
    },
    orderBy: { createdAt: "asc" }
  });

  return {
    caseType,
    caseId,
    entries: logs.map((entry) => {
      const metadata = (entry.metadata ?? {}) as Record<string, unknown>;
      const body =
        typeof metadata.body === "string"
          ? metadata.body
          : typeof metadata.note === "string"
            ? metadata.note
            : null;

      return {
        id: entry.id,
        action: entry.action,
        createdAt: entry.createdAt.toISOString(),
        actor: entry.actor
          ? {
              id: entry.actor.id,
              name: formatUserName(entry.actor),
              role: entry.actor.role,
              employeeId: entry.actor.employeeId
            }
          : null,
        body,
        metadata
      };
    })
  };
}

export async function addCaseNote(options: {
  actorUserId: string;
  caseType: string;
  caseId: string;
  body: string;
}) {
  const caseType = normalizeCaseType(options.caseType);
  await assertCaseExists(caseType, options.caseId);

  const body = options.body.trim();
  if (!body) {
    throw new HttpError(400, { message: "Note body is required." });
  }

  const note = await prisma.auditLog.create({
    data: {
      actorUserId: options.actorUserId,
      action: "case_note_added",
      targetType: CASE_TYPE_TARGET_MAP[caseType],
      targetId: options.caseId,
      metadata: {
        body,
        noteType: "internal"
      }
    }
  });

  emitAdminAuditLogsChanged();
  emitOpsCaseActivityChanged({
    caseType,
    caseId: options.caseId
  });

  return {
    id: note.id,
    caseType,
    caseId: options.caseId,
    body,
    createdAt: note.createdAt.toISOString()
  };
}
