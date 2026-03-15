import { NotificationType, OnlineMeetCoordinationStatus, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

type MeetPlatform = "ZOOM" | "GOOGLE_MEET";
type TimeSlotOption = { id: string; label: string; startsAtIso: string | null };

type OnlineMeetCaseWithMatch = Prisma.OnlineMeetCaseGetPayload<{
  include: {
    match: { include: { userA: { include: { profile: true } }; userB: { include: { profile: true } } } };
  };
}>;

const AWAITING_SELECTION_STATUSES: OnlineMeetCoordinationStatus[] = [
  "OPTIONS_SENT",
  "AWAITING_USER_SELECTIONS",
  "USER_ONE_RESPONDED",
  "USER_TWO_RESPONDED"
];

const TERMINAL_OR_COOLDOWN_STATUSES: OnlineMeetCoordinationStatus[] = [
  "FINALIZED",
  "NO_RESPONSE_TIMEOUT",
  "NO_COMPATIBLE_OVERLAP",
  "COOLDOWN",
  "CANCELED"
];

function asStringArray(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string");
}

function asPlatformOptions(value: Prisma.JsonValue | null | undefined): MeetPlatform[] {
  const values = asStringArray(value);
  return values.filter((entry): entry is MeetPlatform => entry === "ZOOM" || entry === "GOOGLE_MEET");
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
    .filter((entry): entry is TimeSlotOption => Boolean(entry));
}

function overlap(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return left.filter((entry) => rightSet.has(entry));
}

function ensureAssigned(employeeUserId: string, caseItem: { assignedEmployeeId: string | null }) {
  if (caseItem.assignedEmployeeId && caseItem.assignedEmployeeId !== employeeUserId) {
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
      title,
      message,
      deepLinkUrl: "/matches"
    })),
    skipDuplicates: true
  });
}

async function evaluateTimeout(caseId: string) {
  const item = await prisma.onlineMeetCase.findUnique({ where: { id: caseId } });
  if (!item || !item.responseDeadlineAt) return item;
  if (!AWAITING_SELECTION_STATUSES.includes(item.status)) return item;
  if (item.responseDeadlineAt.getTime() >= Date.now()) return item;

  const requesterDone = Boolean(item.requesterPlatformPreference) && asStringArray(item.requesterTimeSelections).length > 0;
  const receiverDone = Boolean(item.receiverPlatformPreference) && asStringArray(item.receiverTimeSelections).length > 0;
  const nonResponderId = !requesterDone ? item.requesterUserId : !receiverDone ? item.receiverUserId : null;
  const responderId = nonResponderId === item.requesterUserId ? item.receiverUserId : item.requesterUserId;

  const updated = await prisma.onlineMeetCase.update({
    where: { id: caseId },
    data: {
      status: "NO_RESPONSE_TIMEOUT",
      timeoutUserId: nonResponderId,
      cooldownUntil: new Date(Date.now() + 12 * 60 * 60 * 1000)
    }
  });

  if (nonResponderId && responderId) {
    await createNotifications(
      [responderId],
      "ONLINE_MEET_TIMEOUT",
      item.matchId,
      "Online Meet Response Missed",
      "The other member did not submit preferences in time. You may retry after cooldown."
    );
  }

  return updated;
}

function mapCaseForUser(caseItem: OnlineMeetCaseWithMatch, userId: string) {
  const match = caseItem.match;
  if (![match.userAId, match.userBId].includes(userId)) {
    throw new HttpError(403, { message: "Not allowed" });
  }

  const me = userId === match.userAId ? match.userA : match.userB;
  const other = userId === match.userAId ? match.userB : match.userA;

  return {
    id: caseItem.id,
    matchId: caseItem.matchId,
    status: caseItem.status,
    assignedEmployeeId: caseItem.assignedEmployeeId,
    responseDeadlineAt: caseItem.responseDeadlineAt,
    cooldownUntil: caseItem.cooldownUntil,
    timeoutUserId: caseItem.timeoutUserId,
    finalPlatform: caseItem.finalPlatform,
    finalTimeSlot: caseItem.finalTimeSlot,
    finalMeetingLink: caseItem.finalMeetingLink,
    users: {
      me: { id: me.id, name: me.profile?.name ?? "Member", locationLabel: me.profile?.locationLabel ?? me.profile?.city ?? "Private Location" },
      other: { id: other.id, name: other.profile?.name ?? "Member", locationLabel: other.profile?.locationLabel ?? other.profile?.city ?? "Private Location" }
    },
    options: {
      platforms: asPlatformOptions(caseItem.platformOptions),
      timeSlots: asTimeSlotOptions(caseItem.timeSlotOptions)
    },
    selections: {
      mine: {
        platform: userId === caseItem.requesterUserId ? caseItem.requesterPlatformPreference : caseItem.receiverPlatformPreference,
        timeSlots: asStringArray(userId === caseItem.requesterUserId ? caseItem.requesterTimeSelections : caseItem.receiverTimeSelections)
      },
      other: {
        platform: userId === caseItem.requesterUserId ? caseItem.receiverPlatformPreference : caseItem.requesterPlatformPreference,
        timeSlots: asStringArray(userId === caseItem.requesterUserId ? caseItem.receiverTimeSelections : caseItem.requesterTimeSelections)
      }
    }
  };
}

export async function notifyOnlineMeetRequest(matchId: string, requesterId: string, receiverId: string) {
  await createNotifications(
    [receiverId],
    "ONLINE_MEET_REQUEST",
    matchId,
    "Online Meet Request",
    "Your match requested a concierge-managed online meet. Please review and respond."
  );
}

export async function createOrActivateOnlineMeetCase(params: { matchId: string; requesterUserId: string; receiverUserId: string }) {
  const existing = await prisma.onlineMeetCase.findUnique({ where: { matchId: params.matchId } });
  if (existing) {
    if (existing.cooldownUntil && existing.cooldownUntil.getTime() > Date.now()) {
      throw new HttpError(409, { message: "Online meet retry is in cooldown." });
    }
    if (!TERMINAL_OR_COOLDOWN_STATUSES.includes(existing.status)) {
      throw new HttpError(409, { message: "An active online meet coordination case already exists." });
    }

    const updated = await prisma.onlineMeetCase.update({
      where: { id: existing.id },
      data: {
        requesterUserId: params.requesterUserId,
        receiverUserId: params.receiverUserId,
        assignedEmployeeId: null,
        status: "ACCEPTED",
        platformOptions: Prisma.DbNull,
        timeSlotOptions: Prisma.DbNull,
        requesterPlatformPreference: null,
        receiverPlatformPreference: null,
        requesterTimeSelections: Prisma.DbNull,
        receiverTimeSelections: Prisma.DbNull,
        optionsSentAt: null,
        responseDeadlineAt: null,
        cooldownUntil: null,
        timeoutUserId: null,
        finalPlatform: null,
        finalTimeSlot: Prisma.DbNull,
        finalMeetingLink: null,
        canceledAt: null,
        canceledByUserId: null,
        cancelReason: null,
        rescheduleRequestedByUserId: null,
        rescheduleReason: null
      }
    });

    await createNotifications(
      [params.requesterUserId, params.receiverUserId],
      "ONLINE_MEET_ACCEPTED",
      params.matchId,
      "Online Meet Approved",
      "Both members agreed. A match handler will now coordinate platform and timing options."
    );

    return updated;
  }

  const created = await prisma.onlineMeetCase.create({
    data: {
      matchId: params.matchId,
      requesterUserId: params.requesterUserId,
      receiverUserId: params.receiverUserId,
      status: "ACCEPTED"
    }
  });

  await createNotifications(
    [params.requesterUserId, params.receiverUserId],
    "ONLINE_MEET_ACCEPTED",
    params.matchId,
    "Online Meet Approved",
    "Both members agreed. A match handler will now coordinate platform and timing options."
  );

  return created;
}

export async function getOnlineMeetCaseForUser(matchId: string, userId: string) {
  const caseItem = await prisma.onlineMeetCase.findUnique({
    where: { matchId },
    include: {
      match: { include: { userA: { include: { profile: true } }, userB: { include: { profile: true } } } }
    }
  });
  if (!caseItem) throw new HttpError(404, { message: "Online meet case not found." });
  if (caseItem.match.unmatchedAt) throw new HttpError(409, { message: "Match is no longer active" });

  await evaluateTimeout(caseItem.id);
  const refreshed = await prisma.onlineMeetCase.findUnique({
    where: { id: caseItem.id },
    include: {
      match: { include: { userA: { include: { profile: true } }, userB: { include: { profile: true } } } }
    }
  });
  if (!refreshed) throw new HttpError(404, { message: "Online meet case not found." });

  return mapCaseForUser(refreshed, userId);
}

export async function submitOnlineMeetSelections(params: {
  matchId: string;
  userId: string;
  platform: MeetPlatform;
  timeSlots: string[];
}) {
  const caseItem = await prisma.onlineMeetCase.findUnique({ where: { matchId: params.matchId }, include: { match: true } });
  if (!caseItem) throw new HttpError(404, { message: "Online meet case not found." });
  if (caseItem.match.unmatchedAt) throw new HttpError(409, { message: "Match is no longer active" });
  if (![caseItem.requesterUserId, caseItem.receiverUserId].includes(params.userId)) throw new HttpError(403, { message: "Not allowed" });

  const maybeTimedOut = await evaluateTimeout(caseItem.id);
  if (!maybeTimedOut) throw new HttpError(404, { message: "Online meet case not found." });

  if (!AWAITING_SELECTION_STATUSES.includes(maybeTimedOut.status)) {
    throw new HttpError(409, { message: "Selections cannot be updated for this case state." });
  }
  if (!maybeTimedOut.responseDeadlineAt || maybeTimedOut.responseDeadlineAt.getTime() < Date.now()) {
    throw new HttpError(409, { message: "Selection window has closed." });
  }

  const allowedPlatforms = new Set(asPlatformOptions(maybeTimedOut.platformOptions));
  const allowedTimeIds = new Set(asTimeSlotOptions(maybeTimedOut.timeSlotOptions).map((entry) => entry.id));
  if (!allowedPlatforms.has(params.platform)) {
    throw new HttpError(400, { message: "Selected platform is unavailable." });
  }
  if (params.timeSlots.some((entry) => !allowedTimeIds.has(entry))) {
    throw new HttpError(400, { message: "Selections include unavailable time slots." });
  }

  const data = params.userId === maybeTimedOut.requesterUserId
    ? ({ requesterPlatformPreference: params.platform, requesterTimeSelections: params.timeSlots } satisfies Prisma.OnlineMeetCaseUpdateInput)
    : ({ receiverPlatformPreference: params.platform, receiverTimeSelections: params.timeSlots } satisfies Prisma.OnlineMeetCaseUpdateInput);

  await prisma.onlineMeetCase.update({ where: { id: maybeTimedOut.id }, data });
  const refreshed = await prisma.onlineMeetCase.findUnique({ where: { id: maybeTimedOut.id } });
  if (!refreshed) throw new HttpError(404, { message: "Online meet case not found." });

  const requesterDone = Boolean(refreshed.requesterPlatformPreference) && asStringArray(refreshed.requesterTimeSelections).length >= 2;
  const receiverDone = Boolean(refreshed.receiverPlatformPreference) && asStringArray(refreshed.receiverTimeSelections).length >= 2;
  if (!requesterDone || !receiverDone) {
    const status: OnlineMeetCoordinationStatus = requesterDone ? "USER_ONE_RESPONDED" : "USER_TWO_RESPONDED";
    await prisma.onlineMeetCase.update({ where: { id: refreshed.id }, data: { status } });
    return { ok: true, status };
  }

  const requesterPlatform = refreshed.requesterPlatformPreference;
  const receiverPlatform = refreshed.receiverPlatformPreference;
  const platformOverlap = requesterPlatform && receiverPlatform && requesterPlatform === receiverPlatform;
  const timeOverlap = overlap(asStringArray(refreshed.requesterTimeSelections), asStringArray(refreshed.receiverTimeSelections));

  if (!platformOverlap || timeOverlap.length === 0) {
    await prisma.onlineMeetCase.update({
      where: { id: refreshed.id },
      data: {
        status: "NO_COMPATIBLE_OVERLAP",
        cooldownUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    });
    await createNotifications(
      [refreshed.requesterUserId, refreshed.receiverUserId],
      "ONLINE_MEET_NO_OVERLAP",
      refreshed.matchId,
      "Online Meet Not Compatible",
      "Your selected platform or timing did not overlap. You may retry after one day."
    );
    return { ok: true, status: "NO_COMPATIBLE_OVERLAP" as const };
  }

  await prisma.onlineMeetCase.update({ where: { id: refreshed.id }, data: { status: "READY_FOR_FINALIZATION" } });
  return { ok: true, status: "READY_FOR_FINALIZATION" as const };
}

export async function listOnlineMeetCasesForEmployee(userId: string) {
  const cases = await prisma.onlineMeetCase.findMany({
    where: {
      OR: [{ assignedEmployeeId: null }, { assignedEmployeeId: userId }, { status: { in: ["REQUESTED", "ACCEPTED", "EMPLOYEE_PREPARING_OPTIONS", "OPTIONS_SENT", "AWAITING_USER_SELECTIONS", "USER_ONE_RESPONDED", "USER_TWO_RESPONDED", "READY_FOR_FINALIZATION", "RESCHEDULE_REQUESTED"] } }]
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

  for (const item of cases) {
    await evaluateTimeout(item.id);
  }

  const refreshed = await prisma.onlineMeetCase.findMany({
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
    cases: refreshed.map((entry) => ({
      id: entry.id,
      matchId: entry.matchId,
      status: entry.status,
      assignedEmployeeId: entry.assignedEmployeeId,
      responseDeadlineAt: entry.responseDeadlineAt,
      cooldownUntil: entry.cooldownUntil,
      finalPlatform: entry.finalPlatform,
      finalTimeSlot: entry.finalTimeSlot,
      finalMeetingLink: entry.finalMeetingLink,
      users: [entry.match.userA, entry.match.userB].map((member) => ({
        id: member.id,
        name: member.profile?.name ?? "Member",
        locationLabel: member.profile?.locationLabel ?? member.profile?.city ?? "Private Location",
        city: member.profile?.city ?? null,
        profession: member.profile?.profession ?? null,
        photoUrl: member.photos[0]?.url ?? null
      })),
      options: {
        platforms: asPlatformOptions(entry.platformOptions),
        timeSlots: asTimeSlotOptions(entry.timeSlotOptions)
      },
      selections: {
        requester: { platform: entry.requesterPlatformPreference, timeSlots: asStringArray(entry.requesterTimeSelections) },
        receiver: { platform: entry.receiverPlatformPreference, timeSlots: asStringArray(entry.receiverTimeSelections) }
      }
    }))
  };
}

export async function assignOnlineMeetCase(caseId: string, employeeUserId: string) {
  const caseItem = await prisma.onlineMeetCase.findUnique({ where: { id: caseId } });
  if (!caseItem) throw new HttpError(404, { message: "Case not found." });
  if (caseItem.assignedEmployeeId && caseItem.assignedEmployeeId !== employeeUserId) {
    throw new HttpError(409, { message: "Case already assigned." });
  }

  return prisma.onlineMeetCase.update({
    where: { id: caseId },
    data: {
      assignedEmployeeId: employeeUserId,
      status: caseItem.status === "ACCEPTED" || caseItem.status === "REQUESTED" ? "EMPLOYEE_PREPARING_OPTIONS" : caseItem.status
    }
  });
}

export async function sendOnlineMeetOptions(params: {
  caseId: string;
  employeeUserId: string;
  platforms: MeetPlatform[];
  timeSlots: TimeSlotOption[];
}) {
  const caseItem = await prisma.onlineMeetCase.findUnique({ where: { id: params.caseId } });
  if (!caseItem) throw new HttpError(404, { message: "Case not found." });
  ensureAssigned(params.employeeUserId, caseItem);

  const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000);
  const updated = await prisma.onlineMeetCase.update({
    where: { id: params.caseId },
    data: {
      assignedEmployeeId: params.employeeUserId,
      status: "AWAITING_USER_SELECTIONS",
      platformOptions: params.platforms,
      timeSlotOptions: params.timeSlots,
      requesterPlatformPreference: null,
      receiverPlatformPreference: null,
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
    "ONLINE_MEET_OPTIONS_SENT",
    updated.matchId,
    "Online Meet Options Ready",
    "Your match handler shared platform and timing options. Please submit your preferences within 12 hours."
  );

  return updated;
}

export async function finalizeOnlineMeetCase(params: {
  caseId: string;
  employeeUserId: string;
  finalPlatform: MeetPlatform;
  finalTimeSlotId: string;
  finalMeetingLink: string;
}) {
  const caseItem = await prisma.onlineMeetCase.findUnique({ where: { id: params.caseId } });
  if (!caseItem) throw new HttpError(404, { message: "Case not found." });
  ensureAssigned(params.employeeUserId, caseItem);
  if (caseItem.status !== "READY_FOR_FINALIZATION") throw new HttpError(409, { message: "Case is not ready for finalization." });

  const platformOptions = asPlatformOptions(caseItem.platformOptions);
  const times = asTimeSlotOptions(caseItem.timeSlotOptions);
  const finalTime = times.find((entry) => entry.id === params.finalTimeSlotId);
  if (!platformOptions.includes(params.finalPlatform) || !finalTime) throw new HttpError(400, { message: "Final choice must be from provided options." });

  if (caseItem.requesterPlatformPreference !== params.finalPlatform || caseItem.receiverPlatformPreference !== params.finalPlatform) {
    throw new HttpError(409, { message: "Final platform must overlap both members' preferences." });
  }

  const requesterTimes = asStringArray(caseItem.requesterTimeSelections);
  const receiverTimes = asStringArray(caseItem.receiverTimeSelections);
  if (!requesterTimes.includes(params.finalTimeSlotId) || !receiverTimes.includes(params.finalTimeSlotId)) {
    throw new HttpError(409, { message: "Final time must overlap both members' preferences." });
  }

  const updated = await prisma.onlineMeetCase.update({
    where: { id: params.caseId },
    data: {
      assignedEmployeeId: params.employeeUserId,
      status: "FINALIZED",
      finalPlatform: params.finalPlatform,
      finalTimeSlot: finalTime,
      finalMeetingLink: params.finalMeetingLink,
      cooldownUntil: null
    }
  });

  await createNotifications(
    [updated.requesterUserId, updated.receiverUserId],
    "ONLINE_MEET_FINALIZED",
    updated.matchId,
    "Online Meet Finalized",
    `Your online meeting is confirmed on ${params.finalPlatform.replace("_", " ")} at ${finalTime.label}. Concierge may follow up personally if needed.`
  );

  return updated;
}

export async function markOnlineMeetTimeout(params: { caseId: string; employeeUserId: string; nonResponderUserId: string }) {
  const caseItem = await prisma.onlineMeetCase.findUnique({ where: { id: params.caseId } });
  if (!caseItem) throw new HttpError(404, { message: "Case not found." });
  ensureAssigned(params.employeeUserId, caseItem);
  if (![caseItem.requesterUserId, caseItem.receiverUserId].includes(params.nonResponderUserId)) {
    throw new HttpError(400, { message: "Invalid member selected for timeout." });
  }

  const updated = await prisma.onlineMeetCase.update({
    where: { id: params.caseId },
    data: {
      assignedEmployeeId: params.employeeUserId,
      status: "NO_RESPONSE_TIMEOUT",
      timeoutUserId: params.nonResponderUserId,
      cooldownUntil: new Date(Date.now() + 12 * 60 * 60 * 1000)
    }
  });

  const responder = params.nonResponderUserId === updated.requesterUserId ? updated.receiverUserId : updated.requesterUserId;
  await createNotifications(
    [responder],
    "ONLINE_MEET_TIMEOUT",
    updated.matchId,
    "Online Meet Response Missed",
    "The other member did not submit preferences in time. Please retry after cooldown if needed."
  );

  return updated;
}

export async function markOnlineMeetNoOverlap(params: { caseId: string; employeeUserId: string }) {
  const caseItem = await prisma.onlineMeetCase.findUnique({ where: { id: params.caseId } });
  if (!caseItem) throw new HttpError(404, { message: "Case not found." });
  ensureAssigned(params.employeeUserId, caseItem);

  const updated = await prisma.onlineMeetCase.update({
    where: { id: params.caseId },
    data: {
      assignedEmployeeId: params.employeeUserId,
      status: "NO_COMPATIBLE_OVERLAP",
      cooldownUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  await createNotifications(
    [updated.requesterUserId, updated.receiverUserId],
    "ONLINE_MEET_NO_OVERLAP",
    updated.matchId,
    "Online Meet Not Compatible",
    "No compatible platform/time overlap was found in this round. You may retry after one day."
  );

  return updated;
}

export async function updateOnlineMeetCancelOrReschedule(params: {
  caseId: string;
  employeeUserId: string;
  action: "CANCEL" | "RESCHEDULE";
  reason: string;
  requestedByUserId?: string | null;
}) {
  const caseItem = await prisma.onlineMeetCase.findUnique({ where: { id: params.caseId } });
  if (!caseItem) throw new HttpError(404, { message: "Case not found." });
  ensureAssigned(params.employeeUserId, caseItem);

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

  const updated = await prisma.onlineMeetCase.update({ where: { id: params.caseId }, data });
  await createNotifications(
    [updated.requesterUserId, updated.receiverUserId],
    "ONLINE_MEET_RESCHEDULE_UPDATE",
    updated.matchId,
    params.action === "CANCEL" ? "Online Meet Canceled" : "Online Meet Reschedule Requested",
    params.action === "CANCEL"
      ? "Your online meeting was canceled under serious-condition concierge handling."
      : "Concierge received a serious-condition reschedule request and will follow up privately."
  );

  return updated;
}
