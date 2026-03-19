import { NotificationType, OfflineMeetCoordinationStatus, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";
import { notificationDedupeKey } from "../utils/notificationDedupe";

type CafeOption = { id: string; name: string; address: string };
type TimeSlotOption = { id: string; label: string; startsAtIso: string | null };

type OfflineMeetCaseWithMatch = Prisma.OfflineMeetCaseGetPayload<{
  include: {
    match: { include: { userA: { include: { profile: true } }; userB: { include: { profile: true } } } };
  };
}>;

const AWAITING_SELECTION_STATUSES: OfflineMeetCoordinationStatus[] = [
  "OPTIONS_SENT",
  "AWAITING_USER_SELECTIONS",
  "USER_ONE_RESPONDED",
  "USER_TWO_RESPONDED"
];

const ACTIVE_COORDINATION_STATUSES: OfflineMeetCoordinationStatus[] = [
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

const TERMINAL_OR_COOLDOWN_STATUSES: OfflineMeetCoordinationStatus[] = [
  "FINALIZED",
  "NO_RESPONSE_TIMEOUT",
  "NO_COMPATIBLE_OVERLAP",
  "COOLDOWN",
  "CANCELED"
];

type OfflineMeetCaseStatusView = "ACTIVE" | "FINALIZED" | "CONFLICT" | "TIMEOUT" | "CANCELED" | "ALL";

const OFFLINE_STATUS_VIEW_MAP: Record<Exclude<OfflineMeetCaseStatusView, "ALL">, OfflineMeetCoordinationStatus[]> = {
  ACTIVE: ACTIVE_COORDINATION_STATUSES,
  FINALIZED: ["FINALIZED"],
  CONFLICT: ["NO_COMPATIBLE_OVERLAP", "RESCHEDULE_REQUESTED"],
  TIMEOUT: ["NO_RESPONSE_TIMEOUT", "COOLDOWN"],
  CANCELED: ["CANCELED"]
};

function parseOfflineStatusView(value?: string): OfflineMeetCaseStatusView {
  if (!value) return "ACTIVE";
  const normalized = value.trim().toUpperCase();
  if (normalized === "ALL") return "ALL";
  if (normalized in OFFLINE_STATUS_VIEW_MAP) {
    return normalized as keyof typeof OFFLINE_STATUS_VIEW_MAP;
  }
  throw new HttpError(400, { message: "Invalid offline meet status view." });
}

function asStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function asCafeOptions(value: Prisma.JsonValue | null | undefined): CafeOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Record<string, unknown>;
      if (typeof candidate.id !== "string" || typeof candidate.name !== "string" || typeof candidate.address !== "string") return null;
      return { id: candidate.id, name: candidate.name, address: candidate.address };
    })
    .filter((item): item is CafeOption => Boolean(item));
}

function asTimeSlotOptions(value: Prisma.JsonValue | null | undefined): TimeSlotOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const candidate = entry as Record<string, unknown>;
      if (typeof candidate.id !== "string" || typeof candidate.label !== "string") return null;
      return { id: candidate.id, label: candidate.label, startsAtIso: typeof candidate.startsAtIso === "string" ? candidate.startsAtIso : null } as TimeSlotOption;
    })
    .filter((item): item is TimeSlotOption => Boolean(item));
}

function overlap(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((entry) => rightSet.has(entry));
}

function ensureAdminUser(userId: string, caseItem: { assignedEmployeeId: string | null }) {
  if (caseItem.assignedEmployeeId && caseItem.assignedEmployeeId !== userId) {
    throw new HttpError(403, { message: "This case is assigned to another employee." });
  }
}

async function createNotifications(userIds: string[], type: NotificationType, matchId: string, title: string, message: string) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      type,
      matchId,
      dedupeKey: notificationDedupeKey({ userId, type, matchId }),
      title,
      message,
      deepLinkUrl: "/matches"
    })),
    skipDuplicates: true
  });
}

async function evaluateTimeout(caseId: string) {
  const caseItem = await prisma.offlineMeetCase.findUnique({ where: { id: caseId } });
  if (!caseItem || !caseItem.responseDeadlineAt) return caseItem;
  if (!AWAITING_SELECTION_STATUSES.includes(caseItem.status)) return caseItem;
  if (caseItem.responseDeadlineAt.getTime() >= Date.now()) return caseItem;

  const requesterCafeSelections = asStringArray(caseItem.requesterCafeSelections);
  const receiverCafeSelections = asStringArray(caseItem.receiverCafeSelections);
  const requesterTimeSelections = asStringArray(caseItem.requesterTimeSelections);
  const receiverTimeSelections = asStringArray(caseItem.receiverTimeSelections);

  const requesterDone = requesterCafeSelections.length > 0 && requesterTimeSelections.length > 0;
  const receiverDone = receiverCafeSelections.length > 0 && receiverTimeSelections.length > 0;

  const nonResponderId = !requesterDone ? caseItem.requesterUserId : !receiverDone ? caseItem.receiverUserId : null;
  const respondingUserId = nonResponderId === caseItem.requesterUserId ? caseItem.receiverUserId : caseItem.requesterUserId;

  const updated = await prisma.offlineMeetCase.update({
    where: { id: caseId },
    data: {
      status: "NO_RESPONSE_TIMEOUT",
      timeoutUserId: nonResponderId,
      cooldownUntil: new Date(Date.now() + 12 * 60 * 60 * 1000)
    }
  });

  if (respondingUserId && nonResponderId) {
    await createNotifications(
      [respondingUserId],
      "OFFLINE_MEET_TIMEOUT",
      caseItem.matchId,
      "Offline Meet Response Missed",
      "The other member did not submit preferences in time. You can retry after the cooldown window."
    );
  }

  return updated;
}

function mapCaseForUser(caseItem: OfflineMeetCaseWithMatch, userId: string) {
  const match = caseItem.match;
  if (![match.userAId, match.userBId].includes(userId)) throw new HttpError(403, { message: "Not allowed" });

  const me = userId === match.userAId ? match.userA : match.userB;
  const other = userId === match.userAId ? match.userB : match.userA;

  return {
    id: caseItem.id,
    matchId: caseItem.matchId,
    status: caseItem.status,
    assignedEmployeeId: caseItem.assignedEmployeeId,
    responseDeadlineAt: caseItem.responseDeadlineAt,
    cooldownUntil: caseItem.cooldownUntil,
    finalCafe: caseItem.finalCafe,
    finalTimeSlot: caseItem.finalTimeSlot,
    timeoutUserId: caseItem.timeoutUserId,
    users: {
      me: {
        id: me.id,
        name: me.profile?.name ?? "Member",
        locationLabel: me.profile?.locationLabel ?? me.profile?.city ?? "Private Location"
      },
      other: {
        id: other.id,
        name: other.profile?.name ?? "Member",
        locationLabel: other.profile?.locationLabel ?? other.profile?.city ?? "Private Location"
      }
    },
    options: {
      cafes: asCafeOptions(caseItem.cafeOptions),
      timeSlots: asTimeSlotOptions(caseItem.timeSlotOptions)
    },
    selections: {
      mine: {
        cafes: asStringArray(userId === caseItem.requesterUserId ? caseItem.requesterCafeSelections : caseItem.receiverCafeSelections),
        timeSlots: asStringArray(userId === caseItem.requesterUserId ? caseItem.requesterTimeSelections : caseItem.receiverTimeSelections)
      },
      other: {
        cafes: asStringArray(userId === caseItem.requesterUserId ? caseItem.receiverCafeSelections : caseItem.requesterCafeSelections),
        timeSlots: asStringArray(userId === caseItem.requesterUserId ? caseItem.receiverTimeSelections : caseItem.requesterTimeSelections)
      }
    }
  };
}

export async function createOrActivateOfflineMeetCase(params: { matchId: string; requesterUserId: string; receiverUserId: string }) {
  const existing = await prisma.offlineMeetCase.findUnique({ where: { matchId: params.matchId } });
  if (existing) {
    if (existing.cooldownUntil && existing.cooldownUntil.getTime() > Date.now()) {
      throw new HttpError(409, { message: "Offline meet retry is in cooldown." });
    }
    if (!TERMINAL_OR_COOLDOWN_STATUSES.includes(existing.status)) {
      throw new HttpError(409, { message: "An active offline meet coordination case already exists." });
    }

    const updated = await prisma.offlineMeetCase.update({
      where: { id: existing.id },
      data: {
        requesterUserId: params.requesterUserId,
        receiverUserId: params.receiverUserId,
        status: "ACCEPTED",
        assignedEmployeeId: null,
        cafeOptions: Prisma.DbNull,
        timeSlotOptions: Prisma.DbNull,
        requesterCafeSelections: Prisma.DbNull,
        receiverCafeSelections: Prisma.DbNull,
        requesterTimeSelections: Prisma.DbNull,
        receiverTimeSelections: Prisma.DbNull,
        optionsSentAt: null,
        responseDeadlineAt: null,
        timeoutUserId: null,
        finalCafe: Prisma.DbNull,
        finalTimeSlot: Prisma.DbNull,
        canceledAt: null,
        canceledByUserId: null,
        cancelReason: null,
        rescheduleRequestedByUserId: null,
        rescheduleReason: null,
        cooldownUntil: null
      }
    });

    await createNotifications(
      [params.requesterUserId, params.receiverUserId],
      "OFFLINE_MEET_ACCEPTED",
      params.matchId,
      "Offline Meet Approved",
      "Both members agreed. A match handler will now prepare curated venue and time options."
    );

    return updated;
  }

  const created = await prisma.offlineMeetCase.create({
    data: {
      matchId: params.matchId,
      requesterUserId: params.requesterUserId,
      receiverUserId: params.receiverUserId,
      status: "ACCEPTED"
    }
  });

  await createNotifications(
    [params.requesterUserId, params.receiverUserId],
    "OFFLINE_MEET_ACCEPTED",
    params.matchId,
    "Offline Meet Approved",
    "Both members agreed. A match handler will now prepare curated venue and time options."
  );

  return created;
}

export async function notifyOfflineMeetRequest(matchId: string, requesterId: string, receiverId: string) {
  await createNotifications(
    [receiverId],
    "OFFLINE_MEET_REQUEST",
    matchId,
    "Offline Meet Request",
    "Your match has requested an in-person meet. Review and accept if you'd like concierge coordination."
  );
}

export async function getOfflineMeetCaseForUser(matchId: string, userId: string) {
  const caseItem = await prisma.offlineMeetCase.findUnique({
    where: { matchId },
    include: {
      match: {
        include: {
          userA: { include: { profile: true } },
          userB: { include: { profile: true } }
        }
      }
    }
  });

  if (!caseItem) throw new HttpError(404, { message: "Offline meet case not found." });
  if (caseItem.match.unmatchedAt) throw new HttpError(409, { message: "Match is no longer active" });

  await evaluateTimeout(caseItem.id);
  const refreshed = await prisma.offlineMeetCase.findUnique({
    where: { id: caseItem.id },
    include: {
      match: {
        include: {
          userA: { include: { profile: true } },
          userB: { include: { profile: true } }
        }
      }
    }
  });

  if (!refreshed) throw new HttpError(404, { message: "Offline meet case not found." });
  return mapCaseForUser(refreshed, userId);
}

export async function submitOfflineMeetSelections(params: { matchId: string; userId: string; cafes: string[]; timeSlots: string[] }) {
  const caseItem = await prisma.offlineMeetCase.findUnique({ where: { matchId: params.matchId }, include: { match: true } });
  if (!caseItem) throw new HttpError(404, { message: "Offline meet case not found." });
  if (caseItem.match.unmatchedAt) throw new HttpError(409, { message: "Match is no longer active" });
  if (![caseItem.requesterUserId, caseItem.receiverUserId].includes(params.userId)) throw new HttpError(403, { message: "Not allowed" });

  const timedOut = await evaluateTimeout(caseItem.id);
  if (!timedOut) throw new HttpError(404, { message: "Offline meet case not found." });

  if (!AWAITING_SELECTION_STATUSES.includes(timedOut.status)) {
    throw new HttpError(409, { message: "Selections cannot be updated for this case state." });
  }
  if (!timedOut.responseDeadlineAt || timedOut.responseDeadlineAt.getTime() < Date.now()) {
    throw new HttpError(409, { message: "Selection window has closed." });
  }

  const cafes = asCafeOptions(timedOut.cafeOptions);
  const times = asTimeSlotOptions(timedOut.timeSlotOptions);
  const allowedCafeIds = new Set(cafes.map((entry) => entry.id));
  const allowedTimeIds = new Set(times.map((entry) => entry.id));

  if (params.cafes.some((entry) => !allowedCafeIds.has(entry)) || params.timeSlots.some((entry) => !allowedTimeIds.has(entry))) {
    throw new HttpError(400, { message: "Selections include unavailable options." });
  }

  const updateData: Prisma.OfflineMeetCaseUpdateInput = params.userId === timedOut.requesterUserId
    ? { requesterCafeSelections: params.cafes, requesterTimeSelections: params.timeSlots }
    : { receiverCafeSelections: params.cafes, receiverTimeSelections: params.timeSlots };

  await prisma.offlineMeetCase.update({ where: { id: timedOut.id }, data: updateData });

  const refreshed = await prisma.offlineMeetCase.findUnique({ where: { id: timedOut.id } });
  if (!refreshed) throw new HttpError(404, { message: "Offline meet case not found." });

  const requesterCafe = asStringArray(refreshed.requesterCafeSelections);
  const receiverCafe = asStringArray(refreshed.receiverCafeSelections);
  const requesterTime = asStringArray(refreshed.requesterTimeSelections);
  const receiverTime = asStringArray(refreshed.receiverTimeSelections);

  const requesterDone = requesterCafe.length === 2 && requesterTime.length >= 3;
  const receiverDone = receiverCafe.length === 2 && receiverTime.length >= 3;

  if (!requesterDone || !receiverDone) {
    const nextStatus: OfflineMeetCoordinationStatus = requesterDone ? "USER_ONE_RESPONDED" : "USER_TWO_RESPONDED";
    await prisma.offlineMeetCase.update({ where: { id: refreshed.id }, data: { status: nextStatus } });
    return { ok: true, status: nextStatus };
  }

  const cafeOverlap = overlap(requesterCafe, receiverCafe);
  const timeOverlap = overlap(requesterTime, receiverTime);

  if (cafeOverlap.length === 0 || timeOverlap.length === 0) {
    await prisma.offlineMeetCase.update({
      where: { id: refreshed.id },
      data: { status: "NO_COMPATIBLE_OVERLAP", cooldownUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) }
    });
    await createNotifications(
      [refreshed.requesterUserId, refreshed.receiverUserId],
      "OFFLINE_MEET_NO_OVERLAP",
      refreshed.matchId,
      "Offline Meet Not Compatible",
      "Your selected options did not overlap this round. You may retry after one day."
    );
    return { ok: true, status: "NO_COMPATIBLE_OVERLAP" as const };
  }

  await prisma.offlineMeetCase.update({ where: { id: refreshed.id }, data: { status: "READY_FOR_FINALIZATION" } });
  return { ok: true, status: "READY_FOR_FINALIZATION" as const };
}

export async function listOfflineMeetCasesForEmployee(userId: string, requestedView?: string) {
  const statusView = parseOfflineStatusView(requestedView);
  const statusFilter = statusView === "ALL"
    ? [...ACTIVE_COORDINATION_STATUSES, ...TERMINAL_OR_COOLDOWN_STATUSES]
    : OFFLINE_STATUS_VIEW_MAP[statusView];
  const cases = await prisma.offlineMeetCase.findMany({
    where: {
      status: { in: statusFilter },
      OR: [{ assignedEmployeeId: null }, { assignedEmployeeId: userId }]
    },
    include: {
      match: {
        include: {
          userA: { include: { profile: true, photos: { orderBy: [{ photoIndex: "asc" }, { createdAt: "asc" }], take: 1 } } },
          userB: { include: { profile: true, photos: { orderBy: [{ photoIndex: "asc" }, { createdAt: "asc" }], take: 1 } } }
        }
      }
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  for (const caseItem of cases) {
    await evaluateTimeout(caseItem.id);
  }

  const refreshed = await prisma.offlineMeetCase.findMany({
    where: {
      status: { in: statusFilter },
      OR: [{ assignedEmployeeId: null }, { assignedEmployeeId: userId }]
    },
    include: {
      match: {
        include: {
          userA: { include: { profile: true, photos: { orderBy: [{ photoIndex: "asc" }, { createdAt: "asc" }], take: 1 } } },
          userB: { include: { profile: true, photos: { orderBy: [{ photoIndex: "asc" }, { createdAt: "asc" }], take: 1 } } }
        }
      }
    },
    orderBy: [{ updatedAt: "desc" }]
  });

  return {
    statusView,
    cases: refreshed.map((entry) => ({
      id: entry.id,
      matchId: entry.matchId,
      status: entry.status,
        createdAt: entry.createdAt.toISOString(),
      assignedEmployeeId: entry.assignedEmployeeId,
      responseDeadlineAt: entry.responseDeadlineAt,
      cooldownUntil: entry.cooldownUntil,
      finalCafe: entry.finalCafe,
      finalTimeSlot: entry.finalTimeSlot,
      users: [entry.match.userA, entry.match.userB].map((member) => ({
        id: member.id,
        name: member.profile?.name ?? "Member",
        locationLabel: member.profile?.locationLabel ?? member.profile?.city ?? "Private Location",
        city: member.profile?.city ?? null,
        profession: member.profile?.profession ?? null,
        photoUrl: member.photos[0]?.url ?? null
      })),
      options: {
        cafes: asCafeOptions(entry.cafeOptions),
        timeSlots: asTimeSlotOptions(entry.timeSlotOptions)
      },
      selections: {
        requester: {
          cafes: asStringArray(entry.requesterCafeSelections),
          timeSlots: asStringArray(entry.requesterTimeSelections)
        },
        receiver: {
          cafes: asStringArray(entry.receiverCafeSelections),
          timeSlots: asStringArray(entry.receiverTimeSelections)
        }
      }
    }))
  };
}

export async function assignOfflineMeetCase(caseId: string, employeeUserId: string) {
  const caseItem = await prisma.offlineMeetCase.findUnique({ where: { id: caseId } });
  if (!caseItem) throw new HttpError(404, { message: "Case not found." });
  if (TERMINAL_OR_COOLDOWN_STATUSES.includes(caseItem.status)) {
    throw new HttpError(409, { message: "Completed or cooldown cases cannot be reassigned." });
  }
  const nextStatus = caseItem.status === "ACCEPTED" || caseItem.status === "REQUESTED" ? "EMPLOYEE_PREPARING_OPTIONS" : caseItem.status;
  const claimResult = await prisma.offlineMeetCase.updateMany({
    where: {
      id: caseId,
      OR: [{ assignedEmployeeId: null }, { assignedEmployeeId: employeeUserId }]
    },
    data: {
      assignedEmployeeId: employeeUserId,
      status: nextStatus
    }
  });
  if (claimResult.count === 0) {
    throw new HttpError(409, { message: "Case already assigned to another employee." });
  }
  const updated = await prisma.offlineMeetCase.findUnique({ where: { id: caseId } });
  if (!updated) throw new HttpError(404, { message: "Case not found." });
  return updated;
}

export async function sendOfflineMeetOptions(params: {
  caseId: string;
  employeeUserId: string;
  cafes: CafeOption[];
  timeSlots: TimeSlotOption[];
}) {
  const caseItem = await prisma.offlineMeetCase.findUnique({ where: { id: params.caseId } });
  if (!caseItem) throw new HttpError(404, { message: "Case not found." });
  ensureAdminUser(params.employeeUserId, caseItem);

  const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000);
  const updated = await prisma.offlineMeetCase.update({
    where: { id: params.caseId },
    data: {
      assignedEmployeeId: params.employeeUserId,
      status: "AWAITING_USER_SELECTIONS",
      cafeOptions: params.cafes,
      timeSlotOptions: params.timeSlots,
      requesterCafeSelections: Prisma.DbNull,
      receiverCafeSelections: Prisma.DbNull,
      requesterTimeSelections: Prisma.DbNull,
      receiverTimeSelections: Prisma.DbNull,
      optionsSentAt: new Date(),
      responseDeadlineAt: deadline,
      timeoutUserId: null,
      cooldownUntil: null
    }
  });

  await createNotifications(
    [updated.requesterUserId, updated.receiverUserId],
    "OFFLINE_MEET_OPTIONS_SENT",
    updated.matchId,
    "Offline Meet Options Ready",
    "Your match handler shared curated cafés and time windows. Please submit your preferences within 12 hours."
  );

  return updated;
}

export async function finalizeOfflineMeetCase(params: { caseId: string; employeeUserId: string; finalCafeId: string; finalTimeSlotId: string }) {
  const caseItem = await prisma.offlineMeetCase.findUnique({ where: { id: params.caseId } });
  if (!caseItem) throw new HttpError(404, { message: "Case not found." });
  ensureAdminUser(params.employeeUserId, caseItem);

  if (caseItem.status !== "READY_FOR_FINALIZATION") {
    throw new HttpError(409, { message: "Case is not ready for finalization." });
  }

  const cafes = asCafeOptions(caseItem.cafeOptions);
  const times = asTimeSlotOptions(caseItem.timeSlotOptions);
  const finalCafe = cafes.find((entry) => entry.id === params.finalCafeId);
  const finalTimeSlot = times.find((entry) => entry.id === params.finalTimeSlotId);
  if (!finalCafe || !finalTimeSlot) {
    throw new HttpError(400, { message: "Final selection must be part of provided options." });
  }

  const requesterCafe = asStringArray(caseItem.requesterCafeSelections);
  const receiverCafe = asStringArray(caseItem.receiverCafeSelections);
  const requesterTime = asStringArray(caseItem.requesterTimeSelections);
  const receiverTime = asStringArray(caseItem.receiverTimeSelections);

  if (!requesterCafe.includes(params.finalCafeId) || !receiverCafe.includes(params.finalCafeId) || !requesterTime.includes(params.finalTimeSlotId) || !receiverTime.includes(params.finalTimeSlotId)) {
    throw new HttpError(409, { message: "Final choice must overlap both members' preferences." });
  }

  const updated = await prisma.offlineMeetCase.update({
    where: { id: params.caseId },
    data: {
      assignedEmployeeId: params.employeeUserId,
      status: "FINALIZED",
      finalCafe,
      finalTimeSlot,
      cooldownUntil: null
    }
  });

  await createNotifications(
    [updated.requesterUserId, updated.receiverUserId],
    "OFFLINE_MEET_FINALIZED",
    updated.matchId,
    "Offline Meet Finalized",
    `Your in-person meeting is confirmed at ${finalCafe.name} — ${finalTimeSlot.label}. Concierge will follow up if required.`
  );

  return updated;
}

export async function markOfflineMeetTimeout(params: { caseId: string; employeeUserId: string; nonResponderUserId: string }) {
  const caseItem = await prisma.offlineMeetCase.findUnique({ where: { id: params.caseId } });
  if (!caseItem) throw new HttpError(404, { message: "Case not found." });
  ensureAdminUser(params.employeeUserId, caseItem);

  if (![caseItem.requesterUserId, caseItem.receiverUserId].includes(params.nonResponderUserId)) {
    throw new HttpError(400, { message: "Invalid member selected for timeout." });
  }

  const updated = await prisma.offlineMeetCase.update({
    where: { id: params.caseId },
    data: {
      assignedEmployeeId: params.employeeUserId,
      status: "NO_RESPONSE_TIMEOUT",
      timeoutUserId: params.nonResponderUserId,
      cooldownUntil: new Date(Date.now() + 12 * 60 * 60 * 1000)
    }
  });

  const respondingUserId = params.nonResponderUserId === updated.requesterUserId ? updated.receiverUserId : updated.requesterUserId;
  await createNotifications(
    [respondingUserId],
    "OFFLINE_MEET_TIMEOUT",
    updated.matchId,
    "Offline Meet Response Missed",
    "The other member did not submit preferences in time. Please retry after cooldown if you still wish to proceed."
  );

  return updated;
}

export async function markOfflineMeetNoOverlap(params: { caseId: string; employeeUserId: string }) {
  const caseItem = await prisma.offlineMeetCase.findUnique({ where: { id: params.caseId } });
  if (!caseItem) throw new HttpError(404, { message: "Case not found." });
  ensureAdminUser(params.employeeUserId, caseItem);

  const updated = await prisma.offlineMeetCase.update({
    where: { id: params.caseId },
    data: {
      assignedEmployeeId: params.employeeUserId,
      status: "NO_COMPATIBLE_OVERLAP",
      cooldownUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  await createNotifications(
    [updated.requesterUserId, updated.receiverUserId],
    "OFFLINE_MEET_NO_OVERLAP",
    updated.matchId,
    "Offline Meet Not Compatible",
    "No overlapping options were found this round. You may try again after one day."
  );

  return updated;
}

export async function updateOfflineMeetCancelOrReschedule(params: {
  caseId: string;
  employeeUserId: string;
  action: "CANCEL" | "RESCHEDULE";
  reason: string;
  requestedByUserId?: string | null;
}) {
  const caseItem = await prisma.offlineMeetCase.findUnique({ where: { id: params.caseId } });
  if (!caseItem) throw new HttpError(404, { message: "Case not found." });
  ensureAdminUser(params.employeeUserId, caseItem);

  if (params.requestedByUserId && ![caseItem.requesterUserId, caseItem.receiverUserId].includes(params.requestedByUserId)) {
    throw new HttpError(400, { message: "Requested member is not part of this case." });
  }

  const data = params.action === "CANCEL"
    ? {
        assignedEmployeeId: params.employeeUserId,
        status: "CANCELED" as const,
        canceledAt: new Date(),
        canceledByUserId: params.requestedByUserId ?? null,
        cancelReason: params.reason
      }
    : {
        assignedEmployeeId: params.employeeUserId,
        status: "RESCHEDULE_REQUESTED" as const,
        rescheduleRequestedByUserId: params.requestedByUserId ?? null,
        rescheduleReason: params.reason
      };

  const updated = await prisma.offlineMeetCase.update({ where: { id: params.caseId }, data });
  await createNotifications(
    [updated.requesterUserId, updated.receiverUserId],
    "OFFLINE_MEET_RESCHEDULE_UPDATE",
    updated.matchId,
    params.action === "CANCEL" ? "Offline Meet Canceled" : "Offline Meet Reschedule Requested",
    params.action === "CANCEL" ? "Your meet has been canceled by concierge under serious-condition protocol." : "Concierge received a serious-condition reschedule request and will follow up privately."
  );

  return updated;
}
