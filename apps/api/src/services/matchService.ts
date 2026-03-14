import { prisma } from "../db/prisma";
import { HttpError } from "../utils/httpErrors";

export async function listMatches(userId: string) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }]
    },
    include: {
      consents: true,
      phoneExchange: true,
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
    const myConsent = match.consents.find((consent) => consent.userId === userId)?.response ?? null;
    const otherConsent = match.consents.find((consent) => consent.userId === otherUser.id)?.response ?? null;

    const consentStatus = match.phoneExchange
      ? "PHONE_EXCHANGE_READY"
      : myConsent === "YES" && otherConsent === "YES"
        ? "CONSENTED"
        : myConsent === "NO" || otherConsent === "NO"
          ? "DECLINED"
          : "PENDING";

    const statusLabel = match.phoneExchange
      ? "Numbers unlocked"
      : myConsent === "YES" && !otherConsent
        ? "Awaiting their number"
        : !myConsent && otherConsent === "YES"
          ? "They shared number. Share yours"
          : myConsent === "NO" || otherConsent === "NO"
            ? "Number sharing declined"
            : "Number sharing not started";

    const primaryPhotoUrl = otherUser.photos?.[0]?.url ?? null;

    return {
      id: match.id,
      createdAt: match.createdAt,
      matchedAt: match.createdAt,
      consentStatus,
      status: statusLabel,
      phoneExchangeReady: Boolean(match.phoneExchange),
      isNumberShared: Boolean(match.phoneExchange),
      myConsent,
      partnerConsent: otherConsent,
      consents: match.consents,
      partnerInfo: {
        id: otherUser.id,
        name: otherUser.profile?.name ?? "Member",
        age: otherUser.profile?.age ?? null,
        city: otherUser.profile?.city ?? null,
        profession: otherUser.profile?.profession ?? null,
        primaryPhotoUrl,
        likedPhotoUrl: primaryPhotoUrl,
        photos: otherUser.photos?.map((photo) => photo.url) ?? []
      },
      user: {
        id: otherUser.id,
        name: otherUser.profile?.name ?? "Member",
        city: otherUser.profile?.city ?? null,
        profession: otherUser.profile?.profession ?? null,
        primaryPhotoUrl,
        photos: otherUser.photos?.map((photo) => photo.url) ?? []
      }
    };
  });

  return { matches: formatted };
}

export async function respondConsent(options: { matchId: string; userId: string; response: "YES" | "NO" }) {
  const match = await prisma.match.findUnique({ where: { id: options.matchId } });
  if (!match || ![match.userAId, match.userBId].includes(options.userId)) {
    throw new HttpError(403, { message: "Not allowed" });
  }
  await prisma.consent.upsert({
    where: { matchId_userId: { matchId: options.matchId, userId: options.userId } },
    update: { response: options.response, respondedAt: new Date() },
    create: { matchId: options.matchId, userId: options.userId, response: options.response }
  });
  const consents = await prisma.consent.findMany({ where: { matchId: options.matchId } });
  const yesCount = consents.filter((c) => c.response === "YES").length;
  if (yesCount === 2) {
    await prisma.phoneExchangeEvent.upsert({
      where: { matchId: options.matchId },
      update: {},
      create: { matchId: options.matchId }
    });
  }
  const phoneExchangeReady = yesCount === 2;
  return {
    ok: true,
    matchId: options.matchId,
    phoneExchangeReady,
    message: phoneExchangeReady ? "Consent confirmed. Phone exchange is ready." : "Consent recorded."
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
  const yesCount = match.consents.filter((c) => c.response === "YES").length;
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
