import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

type ConsentType = "PHONE_NUMBER" | "OFFLINE_MEET" | "ONLINE_MEET" | "SOCIAL_EXCHANGE";
type ConsentResponse = "YES" | "NO";

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

export async function listMatches(userId: string) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }]
    },
    include: {
      consents: true,
      phoneExchange: true,
      offlineMeet: true,
      onlineMeet: true,
      socialExchange: true,
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
          status: getConsentStatus(socialPair.mine, socialPair.other, Boolean(match.socialExchange)),
          myResponse: socialPair.mine,
          otherResponse: socialPair.other,
          ready: Boolean(match.socialExchange)
        }
      },
      consentPayloads: getConsentPayloadMap(match.consents as any, userId, otherUser.id),
      consents: match.consents,
      user: {
        id: otherUser.id,
        name: otherUser.profile?.name ?? "Member",
        city: otherUser.profile?.city ?? null,
        profession: otherUser.profile?.profession ?? null,
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

  await prisma.consent.upsert({
    where: { matchId_userId_type: { matchId: options.matchId, userId: options.userId, type } },
    update: { response: options.response, payload: options.payload ?? undefined, respondedAt: new Date() },
    create: { matchId: options.matchId, userId: options.userId, type, response: options.response, payload: options.payload ?? undefined }
  });

  const consents = await prisma.consent.findMany({ where: { matchId: options.matchId, type } });
  const yesCount = consents.filter((c) => c.response === "YES").length;
  const ready = yesCount === 2;

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
    }
    if (type === "ONLINE_MEET") {
      await prisma.onlineMeetEvent.upsert({
        where: { matchId: options.matchId },
        update: { details: { selections: consents.map((consent) => consent.payload) } },
        create: { matchId: options.matchId, details: { selections: consents.map((consent) => consent.payload) } }
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

  return {
    ok: true,
    matchId: options.matchId,
    type,
    ready,
    message: ready ? "Consent confirmed." : "Consent recorded."
  };
}


export async function getConsentUnlock(options: { matchId: string; userId: string; type: "OFFLINE_MEET" | "ONLINE_MEET" | "SOCIAL_EXCHANGE" }) {
  const match = await prisma.match.findUnique({
    where: { id: options.matchId },
    include: {
      consents: true,
      offlineMeet: true,
      onlineMeet: true,
      socialExchange: true,
      userA: true,
      userB: true
    }
  });
  if (!match) throw new HttpError(404, { message: "Match not found" });
  if (![match.userAId, match.userBId].includes(options.userId)) throw new HttpError(403, { message: "Not allowed" });

  const ready =
    options.type === "OFFLINE_MEET" ? Boolean(match.offlineMeet)
      : options.type === "ONLINE_MEET" ? Boolean(match.onlineMeet)
        : Boolean(match.socialExchange);
  if (!ready) throw new HttpError(403, { message: "Consent not available" });

  const yesCount = match.consents.filter((c) => c.type === options.type && c.response === "YES").length;
  if (yesCount !== 2) throw new HttpError(403, { message: "Consent incomplete" });

  const consentPayloads = match.consents.filter((c) => c.type === options.type).map((c) => ({ userId: c.userId, payload: c.payload }));
  return {
    matchId: match.id,
    type: options.type,
    users: [
      { id: match.userA.id },
      { id: match.userB.id }
    ],
    payloads: consentPayloads
  };
}
export async function getPhoneUnlock(options: { matchId: string; userId: string }) {
  const match = await prisma.match.findUnique({
    where: { id: options.matchId },
    include: {
      consents: true,
      phoneExchange: true,
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
  if (!match.phoneExchange) {
    throw new HttpError(403, { message: "Phone exchange not available" });
  }
  const yesCount = match.consents.filter((c) => c.type === "PHONE_NUMBER" && c.response === "YES").length;
  if (yesCount !== 2) {
    throw new HttpError(403, { message: "Consent incomplete" });
  }
  return {
    matchId: match.id,
    users: [
      { id: match.userA.id, phone: match.userA.phone },
      { id: match.userB.id, phone: match.userB.phone }
    ]
  };
}
