import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";
import { createOrActivateOfflineMeetCase, notifyOfflineMeetRequest } from "./offlineMeetService";
import { createOrActivateOnlineMeetCase, notifyOnlineMeetRequest } from "./onlineMeetService";
import { notificationDedupeKey } from "../utils/notificationDedupe";
import { emitAdminDashboardChanged, emitAlertsChanged, emitMatchesChanged } from "../live/liveEventBroker";

type ConsentType = "PHONE_NUMBER" | "OFFLINE_MEET" | "ONLINE_MEET" | "SOCIAL_EXCHANGE";
type ConsentResponse = "YES" | "NO";
type InteractionRequestStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "CANCELED";
type PhoneCaseStatus = "REQUESTED" | "ACCEPTED" | "REJECTED" | "MUTUAL_CONSENT_CONFIRMED" | "REVEALED" | "CANCELED";

function toInteractionStatus(myConsent: ConsentResponse | null, otherConsent: ConsentResponse | null, ready: boolean): InteractionRequestStatus {
  if (ready || (myConsent === "YES" && otherConsent === "YES")) return "ACCEPTED";
  if (myConsent === "NO") return "CANCELED";
  if (otherConsent === "NO") return "REJECTED";
  return "PENDING";
}

function mapPhoneCaseToInteractionStatus(status: PhoneCaseStatus | null, fallback: InteractionRequestStatus): InteractionRequestStatus {
  if (!status) return fallback;
  if (status === "MUTUAL_CONSENT_CONFIRMED" || status === "REVEALED" || status === "ACCEPTED") return "ACCEPTED";
  if (status === "REJECTED") return "REJECTED";
  if (status === "CANCELED") return "CANCELED";
  return "PENDING";
}

function getConsentStatus(myConsent: ConsentResponse | null, otherConsent: ConsentResponse | null, ready: boolean) {
  if (ready) return "READY";
  if (myConsent === "YES" && otherConsent === "YES") return "CONSENTED";
  if (myConsent === "NO" || otherConsent === "NO") return "DECLINED";
  return "PENDING";
}

function getConsentPayloadMap(consents: Array<{ type: ConsentType; userId: string; payload: unknown }>, userId: string, otherUserId: string) {
  const payloadByType: Record<ConsentType, { mine: unknown; other: unknown }> = {
    PHONE_NUMBER: { mine: null, other: null },
    OFFLINE_MEET: { mine: null, other: null },
    ONLINE_MEET: { mine: null, other: null },
    SOCIAL_EXCHANGE: { mine: null, other: null }
  };
  for (const consent of consents) {
    if (consent.userId === userId) payloadByType[consent.type].mine = consent.payload;
    if (consent.userId === otherUserId) payloadByType[consent.type].other = consent.payload;
  }
  return payloadByType;
}

async function createPhoneExchangeAlert(userId: string, actorUserId: string, matchId: string, type: "PHONE_EXCHANGE_REQUEST" | "PHONE_EXCHANGE_ACCEPTED" | "PHONE_EXCHANGE_REJECTED" | "PHONE_EXCHANGE_MUTUAL_CONSENT_CONFIRMED" | "PHONE_EXCHANGE_REVEALED", message: string) {
  const dedupeKey = notificationDedupeKey({ userId, type, actorUserId, matchId });
  await prisma.notification.upsert({
    where: {
      dedupeKey
    },
    create: {
      userId,
      type,
      actorUserId,
      matchId,
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
  emitAlertsChanged([userId]);
}

async function syncPhoneExchangeCase(options: {
  matchId: string;
  userId: string;
  otherUserId: string;
  response: ConsentResponse;
  yesCount: number;
}) {
  const now = new Date();
  const existing = await prisma.phoneExchangeCase.findUnique({ where: { matchId: options.matchId } });

  if (!existing) {
    if (options.response === "NO") {
      return;
    }

    const created = await prisma.phoneExchangeCase.create({
      data: {
        matchId: options.matchId,
        requesterUserId: options.userId,
        receiverUserId: options.otherUserId,
        status: options.yesCount === 2 ? "MUTUAL_CONSENT_CONFIRMED" : "REQUESTED",
        requesterConsented: true,
        receiverConsented: options.yesCount === 2,
        acceptedAt: options.yesCount === 2 ? now : null,
        mutuallyConfirmedAt: options.yesCount === 2 ? now : null
      }
    });

    await createPhoneExchangeAlert(created.receiverUserId, created.requesterUserId, created.matchId, "PHONE_EXCHANGE_REQUEST", "Your match requested private phone number exchange.");

    if (options.yesCount === 2) {
      await prisma.phoneExchangeEvent.upsert({ where: { matchId: options.matchId }, update: {}, create: { matchId: options.matchId } });
      await createPhoneExchangeAlert(created.requesterUserId, created.receiverUserId, created.matchId, "PHONE_EXCHANGE_MUTUAL_CONSENT_CONFIRMED", "Mutual consent confirmed. Phone numbers are now available.");
      await createPhoneExchangeAlert(created.receiverUserId, created.requesterUserId, created.matchId, "PHONE_EXCHANGE_MUTUAL_CONSENT_CONFIRMED", "Mutual consent confirmed. Phone numbers are now available.");
    }
    return;
  }

  if (options.response === "NO") {
    const rejectByReceiver = existing.receiverUserId === options.userId && existing.status === "REQUESTED";
    await prisma.phoneExchangeCase.update({
      where: { id: existing.id },
      data: rejectByReceiver
        ? {
            status: "REJECTED",
            receiverConsented: false,
            rejectedAt: now,
            canceledAt: null,
            canceledByUserId: null
          }
        : {
            status: "CANCELED",
            canceledAt: now,
            canceledByUserId: options.userId
          }
    });

    await prisma.phoneExchangeEvent.deleteMany({ where: { matchId: options.matchId } });

    if (rejectByReceiver) {
      await createPhoneExchangeAlert(existing.requesterUserId, existing.receiverUserId, existing.matchId, "PHONE_EXCHANGE_REJECTED", "Your phone exchange request was declined.");
    }
    return;
  }

  const requesterConsented = existing.requesterUserId === options.userId ? true : existing.requesterConsented;
  const receiverConsented = existing.receiverUserId === options.userId ? true : existing.receiverConsented;
  const isMutual = requesterConsented && receiverConsented && options.yesCount === 2;

  const updated = await prisma.phoneExchangeCase.update({
    where: { id: existing.id },
    data: {
      requesterConsented,
      receiverConsented,
      acceptedAt: existing.receiverUserId === options.userId ? now : existing.acceptedAt,
      status: isMutual ? "MUTUAL_CONSENT_CONFIRMED" : existing.receiverUserId === options.userId ? "ACCEPTED" : "REQUESTED",
      mutuallyConfirmedAt: isMutual ? now : existing.mutuallyConfirmedAt,
      rejectedAt: null,
      canceledAt: null,
      canceledByUserId: null
    }
  });

  if (existing.receiverUserId === options.userId) {
    await createPhoneExchangeAlert(existing.requesterUserId, existing.receiverUserId, existing.matchId, "PHONE_EXCHANGE_ACCEPTED", "Your match accepted your phone exchange request.");
  }

  if (isMutual) {
    await prisma.phoneExchangeEvent.upsert({ where: { matchId: options.matchId }, update: {}, create: { matchId: options.matchId } });
    await createPhoneExchangeAlert(updated.requesterUserId, updated.receiverUserId, updated.matchId, "PHONE_EXCHANGE_MUTUAL_CONSENT_CONFIRMED", "Mutual consent confirmed. Phone numbers are now available.");
    await createPhoneExchangeAlert(updated.receiverUserId, updated.requesterUserId, updated.matchId, "PHONE_EXCHANGE_MUTUAL_CONSENT_CONFIRMED", "Mutual consent confirmed. Phone numbers are now available.");
  }
}

export async function listMatches(userId: string) {
  const matches = await prisma.match.findMany({
    where: {
      unmatchedAt: null,
      OR: [{ userAId: userId }, { userBId: userId }]
    },
    include: {
      consents: true,
      phoneExchange: true,
      phoneExchangeCase: true,
      offlineMeet: true,
      offlineMeetCase: true,
      onlineMeet: true,
      onlineMeetCase: true,
      socialExchange: true,
      socialExchangeCases: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      userA: {
        select: {
          id: true,
          profile: true,
          photos: { select: { url: true }, orderBy: { createdAt: "asc" } }
        }
      },
      userB: {
        select: {
          id: true,
          profile: true,
          photos: { select: { url: true }, orderBy: { createdAt: "asc" } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const formatted = matches.map((match) => {
    const otherUser = match.userAId === userId ? match.userB : match.userA;
    const getPair = (type: ConsentType) => {
      const mine = match.consents.find((consent) => consent.userId === userId && consent.type === type)?.response ?? null;
      const other = match.consents.find((consent) => consent.userId === otherUser.id && consent.type === type)?.response ?? null;
      return { mine, other };
    };

    const phonePair = getPair("PHONE_NUMBER");
    const offlinePair = getPair("OFFLINE_MEET");
    const onlinePair = getPair("ONLINE_MEET");
    const socialPair = getPair("SOCIAL_EXCHANGE");
    const socialCase = match.socialExchangeCases[0] ?? null;
    const socialActive = socialCase && ["REQUESTED", "ACCEPTED", "AWAITING_HANDLE_SUBMISSION", "HANDLE_SUBMITTED", "READY_TO_REVEAL", "REVEALED"].includes(socialCase.status);
    const phoneCase = match.phoneExchangeCase;

    const fallbackPhoneStatus = toInteractionStatus(phonePair.mine, phonePair.other, Boolean(match.phoneExchange));

    return {
      id: match.id,
      createdAt: match.createdAt,
      consentStatus: getConsentStatus(phonePair.mine, phonePair.other, Boolean(match.phoneExchange)),
      phoneExchangeReady: Boolean(match.phoneExchange),
      consentStates: {
        PHONE_NUMBER: {
          status: getConsentStatus(phonePair.mine, phonePair.other, Boolean(match.phoneExchange)),
          myResponse: phonePair.mine,
          otherResponse: phonePair.other,
          ready: Boolean(match.phoneExchange)
        },
        OFFLINE_MEET: {
          status: getConsentStatus(offlinePair.mine, offlinePair.other, Boolean(match.offlineMeet)),
          myResponse: offlinePair.mine,
          otherResponse: offlinePair.other,
          ready: Boolean(match.offlineMeet)
        },
        ONLINE_MEET: {
          status: getConsentStatus(onlinePair.mine, onlinePair.other, Boolean(match.onlineMeet)),
          myResponse: onlinePair.mine,
          otherResponse: onlinePair.other,
          ready: Boolean(match.onlineMeet)
        },
        SOCIAL_EXCHANGE: {
          status: socialCase ? socialCase.status : getConsentStatus(socialPair.mine, socialPair.other, Boolean(match.socialExchange)),
          myResponse: socialPair.mine,
          otherResponse: socialPair.other,
          ready: Boolean(match.socialExchange) || Boolean(socialCase && ["READY_TO_REVEAL", "REVEALED"].includes(socialCase.status))
        }
      },
      consentPayloads: getConsentPayloadMap(match.consents as Array<{ type: ConsentType; userId: string; payload: unknown }>, userId, otherUser.id),
      interactionRequests: {
        PHONE_EXCHANGE: {
          type: "PHONE_EXCHANGE",
          status: mapPhoneCaseToInteractionStatus(phoneCase?.status ?? null, fallbackPhoneStatus),
          isInitiatedByMe: phoneCase ? phoneCase.requesterUserId === userId : phonePair.mine !== null,
          canInitiate: !phoneCase || phoneCase.status === "REJECTED" || phoneCase.status === "CANCELED",
          requestedAt: phoneCase?.requestedAt ?? match.consents.find((consent) => consent.userId === userId && consent.type === "PHONE_NUMBER")?.respondedAt ?? null
        },
        OFFLINE_MEET: {
          type: "OFFLINE_MEET",
          status: toInteractionStatus(offlinePair.mine, offlinePair.other, Boolean(match.offlineMeet)),
          isInitiatedByMe: offlinePair.mine !== null,
          canInitiate: offlinePair.mine !== "YES" && !match.offlineMeet,
          requestedAt: match.consents.find((consent) => consent.userId === userId && consent.type === "OFFLINE_MEET")?.respondedAt ?? null
        },
        ONLINE_MEET: {
          type: "ONLINE_MEET",
          status: toInteractionStatus(onlinePair.mine, onlinePair.other, Boolean(match.onlineMeet)),
          isInitiatedByMe: onlinePair.mine !== null,
          canInitiate: onlinePair.mine !== "YES" && !match.onlineMeet,
          requestedAt: match.consents.find((consent) => consent.userId === userId && consent.type === "ONLINE_MEET")?.respondedAt ?? null
        },
        SOCIAL_EXCHANGE: {
          type: "SOCIAL_EXCHANGE",
          status: socialCase
            ? socialCase.status === "REJECTED"
              ? "REJECTED"
              : socialCase.status === "CANCELED" || socialCase.status === "EXPIRED"
                ? "CANCELED"
                : "PENDING"
            : toInteractionStatus(socialPair.mine, socialPair.other, Boolean(match.socialExchange)),
          isInitiatedByMe: socialCase ? socialCase.requesterUserId === userId : socialPair.mine !== null,
          canInitiate: !socialActive,
          requestedAt: socialCase?.createdAt ?? match.consents.find((consent) => consent.userId === userId && consent.type === "SOCIAL_EXCHANGE")?.respondedAt ?? null
        }
      },
      phoneExchangeCase: phoneCase
        ? {
            id: phoneCase.id,
            requesterUserId: phoneCase.requesterUserId,
            receiverUserId: phoneCase.receiverUserId,
            status: phoneCase.status,
            requestedAt: phoneCase.requestedAt,
            acceptedAt: phoneCase.acceptedAt,
            rejectedAt: phoneCase.rejectedAt,
            mutuallyConfirmedAt: phoneCase.mutuallyConfirmedAt,
            revealedAt: phoneCase.revealedAt,
            canRequest: phoneCase.status === "REJECTED" || phoneCase.status === "CANCELED",
            canRespond: phoneCase.receiverUserId === userId && phoneCase.status === "REQUESTED",
            canReveal: phoneCase.status === "MUTUAL_CONSENT_CONFIRMED" || phoneCase.status === "REVEALED"
          }
        : null,
      socialExchangeCase: socialCase
        ? {
            id: socialCase.id,
            requesterUserId: socialCase.requesterUserId,
            receiverUserId: socialCase.receiverUserId,
            status: socialCase.status,
            platform: socialCase.platform,
            revealOpenedAt: socialCase.revealOpenedAt,
            revealExpiresAt: socialCase.revealExpiresAt,
            unopenedExpiresAt: socialCase.unopenedExpiresAt,
            cooldownUntil: socialCase.cooldownUntil
          }
        : null,
      offlineMeetCase: match.offlineMeetCase
        ? {
            id: match.offlineMeetCase.id,
            status: match.offlineMeetCase.status,
            responseDeadlineAt: match.offlineMeetCase.responseDeadlineAt,
            cooldownUntil: match.offlineMeetCase.cooldownUntil,
            finalCafe: match.offlineMeetCase.finalCafe,
            finalTimeSlot: match.offlineMeetCase.finalTimeSlot
          }
        : null,
      onlineMeetCase: match.onlineMeetCase
        ? {
            id: match.onlineMeetCase.id,
            status: match.onlineMeetCase.status,
            responseDeadlineAt: match.onlineMeetCase.responseDeadlineAt,
            cooldownUntil: match.onlineMeetCase.cooldownUntil,
            finalPlatform: match.onlineMeetCase.finalPlatform,
            finalTimeSlot: match.onlineMeetCase.finalTimeSlot
          }
        : null,
      consents: match.consents,
      user: {
        id: otherUser.id,
        name: otherUser.profile?.name ?? "Member",
        age: otherUser.profile?.age ?? null,
        city: otherUser.profile?.city ?? null,
        locationLabel: otherUser.profile?.locationLabel ?? null,
        profession: otherUser.profile?.profession ?? null,
        bioShort: otherUser.profile?.bioShort ?? null,
        primaryPhotoUrl: otherUser.photos?.[0]?.url ?? null,
        photos: otherUser.photos?.map((photo) => photo.url) ?? []
      }
    };
  });

  return { matches: formatted };
}

export async function respondConsent(options: {
  matchId: string;
  userId: string;
  response: ConsentResponse;
  type?: ConsentType;
  payload?: Record<string, unknown> | null;
}) {
  const type = options.type ?? "PHONE_NUMBER";
  const match = await prisma.match.findUnique({ where: { id: options.matchId } });
  if (!match || ![match.userAId, match.userBId].includes(options.userId)) {
    throw new HttpError(403, { message: "Not allowed" });
  }
  if (match.unmatchedAt) {
    throw new HttpError(409, { message: "Match is no longer active" });
  }

  await prisma.consent.upsert({
    where: { matchId_userId_type: { matchId: options.matchId, userId: options.userId, type } },
    update: { response: options.response, payload: (options.payload ?? undefined) as never, respondedAt: new Date() },
    create: { matchId: options.matchId, userId: options.userId, type, response: options.response, payload: (options.payload ?? undefined) as never }
  });

  const consents = await prisma.consent.findMany({ where: { matchId: options.matchId, type } });
  const yesCount = consents.filter((c) => c.response === "YES").length;
  const ready = yesCount === 2;

  if (type === "PHONE_NUMBER") {
    const otherUserId = match.userAId === options.userId ? match.userBId : match.userAId;
    await syncPhoneExchangeCase({
      matchId: options.matchId,
      userId: options.userId,
      otherUserId,
      response: options.response,
      yesCount
    });
  }

  if (ready) {
    if (type === "PHONE_NUMBER") {
      await prisma.phoneExchangeEvent.upsert({ where: { matchId: options.matchId }, update: {}, create: { matchId: options.matchId } });
    }
    if (type === "OFFLINE_MEET") {
      await prisma.offlineMeetEvent.upsert({
        where: { matchId: options.matchId },
        update: { details: { selections: consents.map((consent) => consent.payload) } },
        create: { matchId: options.matchId, details: { selections: consents.map((consent) => consent.payload) } }
      });
      const responderConsent = consents.find((consent) => consent.userId === options.userId);
      const otherConsent = consents.find((consent) => consent.userId !== options.userId);
      if (!responderConsent || !otherConsent) {
        throw new HttpError(409, { message: "Consent state is incomplete" });
      }
      await createOrActivateOfflineMeetCase({
        matchId: options.matchId,
        requesterUserId: responderConsent.respondedAt <= otherConsent.respondedAt ? responderConsent.userId : otherConsent.userId,
        receiverUserId: responderConsent.respondedAt <= otherConsent.respondedAt ? otherConsent.userId : responderConsent.userId
      });
    }
    if (type === "ONLINE_MEET") {
      await prisma.onlineMeetEvent.upsert({
        where: { matchId: options.matchId },
        update: { details: { selections: consents.map((consent) => consent.payload) } },
        create: { matchId: options.matchId, details: { selections: consents.map((consent) => consent.payload) } }
      });
      const responderConsent = consents.find((consent) => consent.userId === options.userId);
      const otherConsent = consents.find((consent) => consent.userId !== options.userId);
      if (!responderConsent || !otherConsent) {
        throw new HttpError(409, { message: "Consent state is incomplete" });
      }
      await createOrActivateOnlineMeetCase({
        matchId: options.matchId,
        requesterUserId: responderConsent.respondedAt <= otherConsent.respondedAt ? responderConsent.userId : otherConsent.userId,
        receiverUserId: responderConsent.respondedAt <= otherConsent.respondedAt ? otherConsent.userId : responderConsent.userId
      });
    }
    if (type === "SOCIAL_EXCHANGE") {
      await prisma.socialExchangeEvent.upsert({
        where: { matchId: options.matchId },
        update: { details: { selections: consents.map((consent) => consent.payload) } },
        create: { matchId: options.matchId, details: { selections: consents.map((consent) => consent.payload) } }
      });
    }
  }

  const mine = consents.find((consent) => consent.userId === options.userId)?.response ?? null;
  const other = consents.find((consent) => consent.userId !== options.userId)?.response ?? null;

  if (type === "OFFLINE_MEET" && options.response === "YES" && !ready && other !== "NO") {
    const otherUserId = match.userAId === options.userId ? match.userBId : match.userAId;
    await notifyOfflineMeetRequest(options.matchId, options.userId, otherUserId);
  }
  if (type === "ONLINE_MEET" && options.response === "YES" && !ready && other !== "NO") {
    const otherUserId = match.userAId === options.userId ? match.userBId : match.userAId;
    await notifyOnlineMeetRequest(options.matchId, options.userId, otherUserId);
  }

  emitMatchesChanged([match.userAId, match.userBId]);
  emitAdminDashboardChanged();

  return {
    ok: true,
    matchId: options.matchId,
    type,
    ready,
    status: toInteractionStatus(mine, other, ready),
    message: ready ? "Consent confirmed." : "Consent recorded."
  };
}

export async function getConsentUnlock(options: { matchId: string; userId: string; type: "OFFLINE_MEET" | "ONLINE_MEET" | "SOCIAL_EXCHANGE" }) {
  const match = await prisma.match.findUnique({
    where: { id: options.matchId },
    include: {
      consents: true,
      offlineMeet: true,
      offlineMeetCase: true,
      onlineMeet: true,
      onlineMeetCase: true,
      socialExchange: true,
      userA: true,
      userB: true
    }
  });
  if (!match) throw new HttpError(404, { message: "Match not found" });
  if (![match.userAId, match.userBId].includes(options.userId)) throw new HttpError(403, { message: "Not allowed" });
  if (match.unmatchedAt) throw new HttpError(409, { message: "Match is no longer active" });

  const ready =
    options.type === "OFFLINE_MEET"
      ? Boolean(match.offlineMeet)
      : options.type === "ONLINE_MEET"
        ? Boolean(match.onlineMeet)
        : Boolean(match.socialExchange);
  if (!ready) throw new HttpError(403, { message: "Consent not available" });

  const yesCount = match.consents.filter((c) => c.type === options.type && c.response === "YES").length;
  if (yesCount !== 2) throw new HttpError(403, { message: "Consent incomplete" });

  const consentPayloads = match.consents.filter((c) => c.type === options.type).map((c) => ({ userId: c.userId, payload: c.payload }));
  return {
    matchId: match.id,
    type: options.type,
    users: [{ id: match.userA.id }, { id: match.userB.id }],
    payloads: consentPayloads
  };
}

export async function getPhoneUnlock(options: { matchId: string; userId: string }) {
  const match = await prisma.match.findUnique({
    where: { id: options.matchId },
    include: {
      consents: true,
      phoneExchange: true,
      phoneExchangeCase: true,
      userA: true,
      userB: true
    }
  });
  if (!match) {
    throw new HttpError(404, { message: "Match not found" });
  }
  if (![match.userAId, match.userBId].includes(options.userId)) {
    throw new HttpError(403, { message: "Not allowed" });
  }
  if (match.unmatchedAt) {
    throw new HttpError(409, { message: "Match is no longer active" });
  }

  const phoneCase = match.phoneExchangeCase;
  if (!phoneCase || !["MUTUAL_CONSENT_CONFIRMED", "REVEALED"].includes(phoneCase.status)) {
    throw new HttpError(403, { message: "Phone exchange not available" });
  }

  const yesCount = match.consents.filter((c) => c.type === "PHONE_NUMBER" && c.response === "YES").length;
  if (yesCount !== 2) {
    throw new HttpError(403, { message: "Consent incomplete" });
  }

  if (phoneCase.status !== "REVEALED") {
    await prisma.phoneExchangeCase.update({
      where: { id: phoneCase.id },
      data: { status: "REVEALED", revealedAt: new Date(), revealedByUserId: options.userId }
    });

    const otherUserId = phoneCase.requesterUserId === options.userId ? phoneCase.receiverUserId : phoneCase.requesterUserId;
    await createPhoneExchangeAlert(otherUserId, options.userId, match.id, "PHONE_EXCHANGE_REVEALED", "Your match opened phone number exchange.");
  }

  emitMatchesChanged([match.userAId, match.userBId]);
  emitAdminDashboardChanged();

  return {
    matchId: match.id,
    users: [
      { id: match.userA.id, phone: match.userA.phone },
      { id: match.userB.id, phone: match.userB.phone }
    ]
  };
}

export async function unmatch(options: { matchId: string; userId: string }) {
  const existing = await prisma.match.findUnique({ where: { id: options.matchId } });
  if (!existing || ![existing.userAId, existing.userBId].includes(options.userId)) {
    throw new HttpError(404, { message: "Match not found" });
  }

  const updated = await prisma.match.updateMany({
    where: {
      id: options.matchId,
      unmatchedAt: null,
      OR: [{ userAId: options.userId }, { userBId: options.userId }]
    },
    data: {
      unmatchedAt: new Date(),
      unmatchedByUserId: options.userId
    }
  });

  if (updated.count === 0) {
    emitMatchesChanged([existing.userAId, existing.userBId]);
    emitAdminDashboardChanged();
    return { ok: true, matchId: options.matchId, alreadyUnmatched: true };
  }

  emitMatchesChanged([existing.userAId, existing.userBId]);
  emitAdminDashboardChanged();

  return { ok: true, matchId: options.matchId, alreadyUnmatched: false };
}
