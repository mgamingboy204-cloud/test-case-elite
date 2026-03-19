import { NotificationType, Prisma, SocialExchangeStatus, SocialPlatform } from "@prisma/client";
import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";
import { notificationDedupeKey } from "../utils/notificationDedupe";

const REVEAL_WINDOW_MS = 10 * 60 * 1000;
const UNOPENED_EXPIRY_MS = 24 * 60 * 60 * 1000;
// PRD: cooldown before resend is 48 hours.
const RESEND_COOLDOWN_MS = 48 * 60 * 60 * 1000;

const ACTIVE_STATUSES: SocialExchangeStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "AWAITING_HANDLE_SUBMISSION",
  "HANDLE_SUBMITTED",
  "READY_TO_REVEAL",
  "REVEALED"
];

function plusMs(ms: number): Date {
  return new Date(Date.now() + ms);
}

function toPlatform(value: string): SocialPlatform {
  const normalized = value.trim().toUpperCase();
  if (normalized === "SNAPCHAT") return "SNAPCHAT";
  if (normalized === "INSTAGRAM") return "INSTAGRAM";
  if (normalized === "LINKEDIN") return "LINKEDIN";
  throw new HttpError(400, { message: "Unsupported social platform" });
}

function normalizeHandle(raw: string): string {
  const value = raw.trim();
  if (value.length < 2 || value.length > 60) {
    throw new HttpError(400, { message: "Handle must be between 2 and 60 characters." });
  }
  if (!/^[a-zA-Z0-9._@-]+$/.test(value)) {
    throw new HttpError(400, { message: "Handle contains invalid characters." });
  }
  return value;
}

async function createAlert(userId: string, type: NotificationType, matchId: string, actorUserId: string, message: string) {
  const dedupeKey = notificationDedupeKey({ userId, type, actorUserId, matchId });
  await prisma.notification.upsert({
    where: {
      dedupeKey
    },
    create: {
      userId,
      type,
      matchId,
      actorUserId,
      dedupeKey,
      message,
      deepLinkUrl: "/matches"
    },
    update: {
      isRead: false,
      readAt: null,
      createdAt: new Date(),
      message,
      deepLinkUrl: "/matches"
    }
  });
}

async function requireActiveMatch(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) throw new HttpError(404, { message: "Match not found" });
  if (match.unmatchedAt) throw new HttpError(409, { message: "Match is no longer active" });
  if (![match.userAId, match.userBId].includes(userId)) throw new HttpError(403, { message: "Not allowed" });
  return match;
}

async function maybeExpire(caseId: string) {
  const existing = await prisma.socialExchangeCase.findUnique({ where: { id: caseId } });
  if (!existing) return null;

  const now = new Date();
  const openedExpired = existing.revealExpiresAt && existing.revealExpiresAt <= now;
  const unopenedExpired = existing.unopenedExpiresAt && !existing.revealOpenedAt && existing.unopenedExpiresAt <= now;
  if (!openedExpired && !unopenedExpired) return existing;

  const expired = await prisma.socialExchangeCase.update({
    where: { id: caseId },
    data: {
      status: "EXPIRED",
      expiredAt: now,
      revealExpiresAt: existing.revealExpiresAt,
      handleValue: null,
      platform: null,
      cooldownUntil: plusMs(RESEND_COOLDOWN_MS)
    }
  });

  await createAlert(expired.requesterUserId, "SOCIAL_EXCHANGE_EXPIRED", expired.matchId, expired.receiverUserId, "Your social handle reveal expired.");
  await createAlert(expired.receiverUserId, "SOCIAL_EXCHANGE_EXPIRED", expired.matchId, expired.requesterUserId, "A social handle reveal has expired.");
  await createAlert(expired.requesterUserId, "SOCIAL_EXCHANGE_RESEND_AVAILABLE", expired.matchId, expired.receiverUserId, "You can resend a social exchange request after cooldown.");

  return expired;
}

function assertParticipant(caseRecord: { requesterUserId: string; receiverUserId: string }, userId: string) {
  if (caseRecord.requesterUserId !== userId && caseRecord.receiverUserId !== userId) {
    throw new HttpError(403, { message: "Not allowed" });
  }
}

function toCaseView(caseRecord: {
  id: string;
  matchId: string;
  requesterUserId: string;
  receiverUserId: string;
  status: SocialExchangeStatus;
  platform: SocialPlatform | null;
  handleValue: string | null;
  revealOpenedAt: Date | null;
  revealExpiresAt: Date | null;
  unopenedExpiresAt: Date | null;
  cooldownUntil: Date | null;
  createdAt: Date;
}) {
  return {
    id: caseRecord.id,
    matchId: caseRecord.matchId,
    requesterUserId: caseRecord.requesterUserId,
    receiverUserId: caseRecord.receiverUserId,
    status: caseRecord.status,
    platform: caseRecord.platform,
    handleVisible: Boolean(caseRecord.handleValue),
    revealOpenedAt: caseRecord.revealOpenedAt,
    revealExpiresAt: caseRecord.revealExpiresAt,
    unopenedExpiresAt: caseRecord.unopenedExpiresAt,
    cooldownUntil: caseRecord.cooldownUntil,
    createdAt: caseRecord.createdAt
  };
}

export async function createSocialExchangeRequest(options: { matchId: string; userId: string }) {
  const match = await requireActiveMatch(options.matchId, options.userId);
  const receiverUserId = match.userAId === options.userId ? match.userBId : match.userAId;

  const latest = await prisma.socialExchangeCase.findFirst({
    where: {
      matchId: options.matchId,
      OR: [
        { requesterUserId: options.userId, receiverUserId },
        { requesterUserId: receiverUserId, receiverUserId: options.userId }
      ]
    },
    orderBy: { createdAt: "desc" }
  });

  if (latest) {
    const hydrated = await maybeExpire(latest.id);
    if (hydrated && ACTIVE_STATUSES.includes(hydrated.status)) {
      throw new HttpError(409, { message: "A social exchange is already active for this match." });
    }
    if (hydrated?.cooldownUntil && hydrated.cooldownUntil > new Date()) {
      throw new HttpError(429, { message: `Resend is on cooldown until ${hydrated.cooldownUntil.toISOString()}.` });
    }
  }

  const socialCase = await prisma.socialExchangeCase.create({
    data: {
      matchId: options.matchId,
      requesterUserId: options.userId,
      receiverUserId,
      status: "REQUESTED",
      unopenedExpiresAt: plusMs(UNOPENED_EXPIRY_MS)
    }
  });

  await createAlert(receiverUserId, "SOCIAL_EXCHANGE_REQUEST", options.matchId, options.userId, "Your match requested a temporary social exchange.");

  return { ok: true, socialExchange: toCaseView(socialCase) };
}

export async function respondToSocialExchangeRequest(options: { caseId: string; userId: string; response: "ACCEPT" | "REJECT" }) {
  const socialCase = await prisma.socialExchangeCase.findUnique({ where: { id: options.caseId } });
  if (!socialCase) throw new HttpError(404, { message: "Social exchange not found" });
  assertParticipant(socialCase, options.userId);
  await requireActiveMatch(socialCase.matchId, options.userId);

  const hydrated = await maybeExpire(socialCase.id);
  if (!hydrated) throw new HttpError(404, { message: "Social exchange not found" });
  if (hydrated.receiverUserId !== options.userId) throw new HttpError(403, { message: "Only the invited member can respond." });
  if (hydrated.status !== "REQUESTED") throw new HttpError(409, { message: "Request is no longer pending." });

  if (options.response === "REJECT") {
    const rejected = await prisma.socialExchangeCase.update({
      where: { id: hydrated.id },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        cooldownUntil: plusMs(RESEND_COOLDOWN_MS)
      }
    });
    await createAlert(rejected.requesterUserId, "SOCIAL_EXCHANGE_REJECTED", rejected.matchId, rejected.receiverUserId, "Your social exchange request was declined.");
    return { ok: true, socialExchange: toCaseView(rejected) };
  }

  const accepted = await prisma.socialExchangeCase.update({
    where: { id: hydrated.id },
    data: {
      status: "AWAITING_HANDLE_SUBMISSION",
      acceptedAt: new Date()
    }
  });
  await createAlert(accepted.requesterUserId, "SOCIAL_EXCHANGE_ACCEPTED", accepted.matchId, accepted.receiverUserId, "Your social exchange request was accepted. Submit your handle.");
  return { ok: true, socialExchange: toCaseView(accepted) };
}

export async function submitSocialHandle(options: { caseId: string; userId: string; platform: string; handle: string }) {
  const socialCase = await prisma.socialExchangeCase.findUnique({ where: { id: options.caseId } });
  if (!socialCase) throw new HttpError(404, { message: "Social exchange not found" });
  assertParticipant(socialCase, options.userId);
  await requireActiveMatch(socialCase.matchId, options.userId);

  const hydrated = await maybeExpire(socialCase.id);
  if (!hydrated) throw new HttpError(404, { message: "Social exchange not found" });
  if (hydrated.requesterUserId !== options.userId) throw new HttpError(403, { message: "Only requester can submit a handle." });
  if (hydrated.status !== "AWAITING_HANDLE_SUBMISSION" && hydrated.status !== "ACCEPTED") {
    throw new HttpError(409, { message: "Handle submission is not available for this request." });
  }

  const submitted = await prisma.socialExchangeCase.update({
    where: { id: hydrated.id },
    data: {
      status: "READY_TO_REVEAL",
      platform: toPlatform(options.platform),
      handleValue: normalizeHandle(options.handle),
      submittedAt: new Date(),
      unopenedExpiresAt: plusMs(UNOPENED_EXPIRY_MS)
    }
  });

  await createAlert(submitted.receiverUserId, "SOCIAL_EXCHANGE_HANDLE_READY", submitted.matchId, submitted.requesterUserId, "A temporary social handle is ready to reveal.");

  return { ok: true, socialExchange: toCaseView(submitted) };
}

export async function openSocialReveal(options: { caseId: string; userId: string }) {
  const socialCase = await prisma.socialExchangeCase.findUnique({ where: { id: options.caseId } });
  if (!socialCase) throw new HttpError(404, { message: "Social exchange not found" });
  assertParticipant(socialCase, options.userId);
  await requireActiveMatch(socialCase.matchId, options.userId);

  const hydrated = await maybeExpire(socialCase.id);
  if (!hydrated) throw new HttpError(404, { message: "Social exchange not found" });
  if (hydrated.receiverUserId !== options.userId) throw new HttpError(403, { message: "Only the intended recipient can reveal this handle." });

  const now = new Date();
  if (hydrated.status === "READY_TO_REVEAL") {
    const revealed = await prisma.socialExchangeCase.update({
      where: { id: hydrated.id },
      data: {
        status: "REVEALED",
        revealOpenedAt: now,
        revealExpiresAt: new Date(now.getTime() + REVEAL_WINDOW_MS)
      }
    });
    await createAlert(revealed.requesterUserId, "SOCIAL_EXCHANGE_VIEWED", revealed.matchId, revealed.receiverUserId, "Your social handle was viewed.");

    const secondsRemaining =
      revealed.revealExpiresAt ? Math.max(0, Math.floor((revealed.revealExpiresAt.getTime() - now.getTime()) / 1000)) : null;

    return {
      ok: true,
      status: revealed.status,
      platform: revealed.platform,
      handle: revealed.handleValue,
      revealExpiresAt: revealed.revealExpiresAt,
      secondsRemaining
    };
  }

  if (hydrated.status !== "REVEALED") {
    throw new HttpError(409, { message: "Handle is not ready to reveal." });
  }

  if (hydrated.revealExpiresAt && hydrated.revealExpiresAt <= now) {
    await maybeExpire(hydrated.id);
    throw new HttpError(410, { message: "This reveal has expired." });
  }

  return {
    ok: true,
    status: hydrated.status,
    platform: hydrated.platform,
    handle: hydrated.handleValue,
    revealExpiresAt: hydrated.revealExpiresAt,
    secondsRemaining:
      hydrated.revealExpiresAt ? Math.max(0, Math.floor((hydrated.revealExpiresAt.getTime() - now.getTime()) / 1000)) : null
  };
}

export async function listSocialExchangeCases(options: { matchId: string; userId: string }) {
  await requireActiveMatch(options.matchId, options.userId);
  const cases = await prisma.socialExchangeCase.findMany({
    where: {
      matchId: options.matchId,
      OR: [{ requesterUserId: options.userId }, { receiverUserId: options.userId }]
    },
    orderBy: { createdAt: "desc" },
    take: 6
  });

  const hydratedCases = [];
  for (const socialCase of cases) {
    const hydrated = await maybeExpire(socialCase.id);
    if (hydrated) hydratedCases.push(hydrated);
  }

  return {
    cases: hydratedCases.map((socialCase) => ({
      ...toCaseView(socialCase),
      canRespond: socialCase.receiverUserId === options.userId && socialCase.status === "REQUESTED",
      canSubmitHandle: socialCase.requesterUserId === options.userId && socialCase.status === "AWAITING_HANDLE_SUBMISSION",
      canReveal: socialCase.receiverUserId === options.userId && (socialCase.status === "READY_TO_REVEAL" || socialCase.status === "REVEALED")
    }))
  };
}
