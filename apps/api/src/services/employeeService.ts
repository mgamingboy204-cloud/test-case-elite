import bcrypt from "bcrypt";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

const SOFT_CAPACITY = 30;
const HARD_CAPACITY = 40;

export async function validateEmployeeLogin(options: { employeeId: string; password: string }) {
  const employeeId = options.employeeId.trim();
  const user = await prisma.user.findFirst({
    where: {
      employeeId,
      role: { in: ["EMPLOYEE", "ADMIN"] },
      deactivatedAt: null,
      deletedAt: null,
      status: { not: "BANNED" }
    }
  });

  if (!user) throw new HttpError(401, { message: "Invalid employee credentials" });
  const isValid = await bcrypt.compare(options.password, user.passwordHash);
  if (!isValid) throw new HttpError(401, { message: "Invalid employee credentials" });

  return user;
}

export async function selectEmployeeForAssignment() {
  const employees = await prisma.user.findMany({
    where: {
      role: { in: ["EMPLOYEE", "ADMIN"] },
      deactivatedAt: null,
      deletedAt: null,
      status: { not: "BANNED" }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      displayName: true,
      _count: {
        select: {
          managedMembers: {
            where: {
              deletedAt: null,
              deactivatedAt: null,
              status: { in: ["APPROVED", "PENDING"] }
            }
          }
        }
      }
    }
  });

  if (employees.length === 0) return null;

  const sorted = employees
    .map((employee) => ({ ...employee, activeCount: employee._count.managedMembers }))
    .sort((a, b) => a.activeCount - b.activeCount);

  const belowSoftCap = sorted.find((employee) => employee.activeCount < SOFT_CAPACITY);
  if (belowSoftCap) return belowSoftCap;

  const belowHardCap = sorted.find((employee) => employee.activeCount < HARD_CAPACITY);
  if (belowHardCap) return belowHardCap;

  return sorted[0] ?? null;
}

export async function assignExecutiveToUser(options: { userId: string; preferredEmployeeId?: string | null; override?: boolean }) {
  const user = await prisma.user.findUnique({ where: { id: options.userId }, select: { id: true, assignedEmployeeId: true } });
  if (!user) throw new HttpError(404, { message: "User not found" });

  if (user.assignedEmployeeId && !options.override) {
    return { assignedEmployeeId: user.assignedEmployeeId, assignmentMode: "EXISTING" as const };
  }

  let targetEmployeeId = options.preferredEmployeeId ?? null;

  if (targetEmployeeId) {
    const eligible = await prisma.user.findFirst({
      where: {
        id: targetEmployeeId,
        role: { in: ["EMPLOYEE", "ADMIN"] },
        deactivatedAt: null,
        deletedAt: null,
        status: { not: "BANNED" }
      },
      select: { id: true }
    });
    if (!eligible) targetEmployeeId = null;
  }

  if (!targetEmployeeId) {
    const selected = await selectEmployeeForAssignment();
    targetEmployeeId = selected?.id ?? null;
  }

  if (!targetEmployeeId) {
    return { assignedEmployeeId: null, assignmentMode: "UNASSIGNED" as const };
  }

  const updated = await prisma.user.update({
    where: { id: options.userId },
    data: { assignedEmployeeId: targetEmployeeId, assignedAt: new Date() },
    select: { assignedEmployeeId: true }
  });

  return { assignedEmployeeId: updated.assignedEmployeeId, assignmentMode: options.preferredEmployeeId ? "PREFERRED" as const : "LOAD_BALANCED" as const };
}

export async function ensureUserExecutiveAssignmentAfterOnboarding(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      onboardingStep: true,
      assignedEmployeeId: true,
      verifiedByEmployeeId: true,
      deletedAt: true,
      deactivatedAt: true
    }
  });

  if (!user || user.deletedAt || user.deactivatedAt) return null;
  if (user.onboardingStep !== "ACTIVE") return null;

  return assignExecutiveToUser({
    userId,
    preferredEmployeeId: user.verifiedByEmployeeId,
    override: false
  });
}

export async function listEmployeeWorkloads() {
  const employees = await prisma.user.findMany({
    where: { role: { in: ["EMPLOYEE", "ADMIN"] }, deactivatedAt: null, deletedAt: null },
    select: {
      id: true,
      employeeId: true,
      firstName: true,
      lastName: true,
      displayName: true,
      _count: {
        select: {
          managedMembers: { where: { deletedAt: null, deactivatedAt: null } },
          offlineMeetAssignments: { where: { status: { in: ["ACCEPTED", "EMPLOYEE_PREPARING_OPTIONS", "OPTIONS_SENT", "AWAITING_USER_SELECTIONS", "USER_ONE_RESPONDED", "USER_TWO_RESPONDED", "READY_FOR_FINALIZATION", "RESCHEDULE_REQUESTED"] } } },
          onlineMeetAssignments: { where: { status: { in: ["ACCEPTED", "EMPLOYEE_PREPARING_OPTIONS", "OPTIONS_SENT", "AWAITING_USER_SELECTIONS", "USER_ONE_RESPONDED", "USER_TWO_RESPONDED", "READY_FOR_FINALIZATION", "RESCHEDULE_REQUESTED"] } } }
        }
      }
    },
    orderBy: [{ firstName: "asc" }]
  });

  return employees.map((employee) => ({
    id: employee.id,
    employeeId: employee.employeeId,
    name: [employee.firstName, employee.lastName].filter(Boolean).join(" ") || employee.displayName || "Employee",
    assignedMembers: employee._count.managedMembers,
    activeOfflineCases: employee._count.offlineMeetAssignments,
    activeOnlineCases: employee._count.onlineMeetAssignments
  }));
}
