import { Request, Response } from "express";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";
import {
  approveVerificationRequest,
  assignVerificationRequest,
  rejectVerificationRequest,
  startVerificationRequest
} from "../services/adminService";
import { listOfflineMeetCasesForEmployee } from "../services/offlineMeetService";
import { listOnlineMeetCasesForEmployee } from "../services/onlineMeetService";

function formatMemberName(member: {
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
}) {
  return [member.firstName, member.lastName].filter(Boolean).join(" ") || member.displayName || "Member";
}

function formatPhoneLast4(phone: string) {
  const trimmed = phone.replace(/\D/g, "");
  return trimmed.slice(-4);
}

export async function listEmployeePendingVerificationHandler(req: Request, res: Response) {
  // PRD: queue of pending verification requests (status = PENDING).
  const actorUserId = res.locals.user.id as string;

  const requests = await prisma.verificationRequest.findMany({
    where: { status: "REQUESTED", assignedEmployeeId: null },
    include: { user: { select: { id: true, phone: true, firstName: true, lastName: true, displayName: true } } },
    orderBy: { createdAt: "asc" }
  });

  const RESPONSE_TIMEOUT_MS = 5 * 60 * 1000;
  const queue = requests.map((r) => {
    const nameFirst = formatMemberName({
      firstName: r.user.firstName,
      lastName: r.user.lastName,
      displayName: r.user.displayName
    }).split(" ")[0];

    const elapsedMs = Date.now() - r.createdAt.getTime();
    const waitTimeSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
    const waitTimeMinutes = Math.floor(waitTimeSeconds / 60);
    const waitTimeRemainingSeconds = waitTimeSeconds % 60;

    return {
      id: r.id,
      status: "PENDING",
      user: {
        name: nameFirst,
        phoneLast4: formatPhoneLast4(r.user.phone)
      },
      requestedAt: r.createdAt.toISOString(),
      // PRD UI can render "wait time"; we provide seconds + a human-friendly minutes/seconds split.
      waitTimeSeconds: RESPONSE_TIMEOUT_MS > 0 ? waitTimeSeconds : waitTimeSeconds,
      waitTimeMinutes,
      waitTimeRemainingSeconds
    };
  });

  void actorUserId; // reserved for future permission logic
  return res.json({ requests: queue });
}

export async function assignEmployeeVerificationHandler(req: Request, res: Response) {
  const verificationId = req.params.verificationId;
  const actorUserId = res.locals.user.id as string;
  if (!verificationId) throw new HttpError(400, { message: "verificationId is required" });

  await assignVerificationRequest(verificationId, actorUserId);
  return res.json({ assigned: true });
}

export async function employeeSendMeetLinkHandler(req: Request, res: Response) {
  const verificationId = req.params.verificationId;
  const actorUserId = res.locals.user.id as string;
  const { meetLink } = req.body as { meetLink: string };
  if (!verificationId) throw new HttpError(400, { message: "verificationId is required" });
  if (typeof meetLink !== "string" || !meetLink.trim()) throw new HttpError(400, { message: "meetLink is required" });

  await startVerificationRequest(verificationId, meetLink.trim(), actorUserId, false);
  return res.json({ sent: true });
}

export async function employeeVerificationResultHandler(req: Request, res: Response) {
  const verificationId = req.params.verificationId;
  const actorUserId = res.locals.user.id as string;
  const { result, notes } = req.body as { result: "APPROVED" | "REJECTED"; notes?: string };
  if (!verificationId) throw new HttpError(400, { message: "verificationId is required" });

  if (result === "APPROVED") {
    await approveVerificationRequest(verificationId, actorUserId, false);
  } else {
    await rejectVerificationRequest(verificationId, actorUserId, String(notes ?? "Rejected by employee"), false);
  }
  return res.json({ updated: true });
}

export async function listEmployeeInteractionsHandler(req: Request, res: Response) {
  const actorUserId = res.locals.user.id as string;
  const type = typeof req.query.type === "string" ? req.query.type : "ALL";
  const status = typeof req.query.status === "string" ? req.query.status : "ACCEPTED";

  const wantsOffline = type === "OFFLINE_MEET" || type === "ALL";
  const wantsOnline = type === "ONLINE_MEET" || type === "ALL";

  const acceptedOnly = status === "ACCEPTED";

  const [offline, online] = await Promise.all([
    wantsOffline ? listOfflineMeetCasesForEmployee(actorUserId, "ACTIVE") : Promise.resolve({ cases: [] }),
    wantsOnline ? listOnlineMeetCasesForEmployee(actorUserId, "ACTIVE") : Promise.resolve({ cases: [] })
  ]);

  const offlineCases = (offline as any).cases as Array<any>;
  const onlineCases = (online as any).cases as Array<any>;

  const merged = [
    ...(acceptedOnly
      ? offlineCases.filter((c) => c.status === "ACCEPTED").map((c) => ({ ...c, interactionType: "OFFLINE_MEET" }))
      : offlineCases.map((c) => ({ ...c, interactionType: "OFFLINE_MEET" }))),
    ...(acceptedOnly
      ? onlineCases.filter((c) => c.status === "ACCEPTED").map((c) => ({ ...c, interactionType: "ONLINE_MEET" }))
      : onlineCases.map((c) => ({ ...c, interactionType: "ONLINE_MEET" })))
  ];

  // PRD: return match pair names, interaction type, status, time since created.
  // We include createdAt so the UI can compute "time since".
  const interactions = merged.map((c) => {
    const users = c.users ?? [];
    const a = users[0];
    const b = users[1];
    return {
      id: c.id,
      interactionType: c.interactionType,
      status: c.status,
      createdAt: c.createdAt,
      match: {
        a: {
          id: a?.id ?? null,
          name: a?.name ?? "Member",
          city: a?.city ?? null,
          locationLabel: a?.locationLabel ?? null,
          photoUrl: a?.photoUrl ?? null
        },
        b: {
          id: b?.id ?? null,
          name: b?.name ?? "Member",
          city: b?.city ?? null,
          locationLabel: b?.locationLabel ?? null,
          photoUrl: b?.photoUrl ?? null
        }
      },
      matchPairNames: [a?.name ?? "Member", b?.name ?? "Member"].filter(Boolean)
    };
  });

  return res.json({ interactions });
}

export async function listEmployeeMembersHandler(req: Request, res: Response) {
  const actorUserId = res.locals.user.id as string;
  const MAX = 40;

  const members = await prisma.user.findMany({
    where: {
      assignedEmployeeId: actorUserId,
      deletedAt: null,
      deactivatedAt: null
    },
    orderBy: { lastActiveAt: "desc" },
    take: MAX,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      displayName: true,
      status: true,
      subscriptionTier: true,
      subscriptionEndsAt: true,
      lastActiveAt: true
    }
  });

  const capacityApproaching = members.length >= 35;
  const capacity = { max: MAX, approaching: capacityApproaching };

  const formatPlan = (tier: string) => {
    if (tier === "FREE") return "Free";
    if (tier === "PREMIUM") return "Premium";
    if (tier === "ELITE") return "Elite";
    return tier;
  };

  return res.json({
    members: members.map((m) => ({
      id: m.id,
      name: formatMemberName({ firstName: m.firstName, lastName: m.lastName, displayName: m.displayName }),
      status: m.status,
      plan: formatPlan(m.subscriptionTier),
      subscriptionEndsAt: m.subscriptionEndsAt ? m.subscriptionEndsAt.toISOString() : null,
      lastActivityAt: m.lastActiveAt.toISOString()
    })),
    capacity
  });
}

