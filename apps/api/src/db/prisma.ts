import { PrismaClient } from "@prisma/client";
import { sendFcmLegacyPush } from "../utils/fcm";

export const prisma = new PrismaClient();

let shutdownRegistered = false;

// Best-effort FCM push:
// - Stores FCM registration tokens via `POST /users/fcm-token` into `DeviceToken.tokenHash`.
// - Sends a push whenever a new Notification row is created (deduped by `dedupeKey`).
// - If FCM_SERVER_KEY is missing, it silently skips sending.
//
// This is intentionally non-blocking for API responses.
prisma.$use(async (params, next) => {
  if (params.model !== "Notification") {
    return next(params);
  }

  const actionsToHook = new Set(["create", "createMany", "upsert"]);
  if (!actionsToHook.has(params.action)) {
    return next(params);
  }

  type Candidate = {
    dedupeKey?: unknown;
    userId?: unknown;
    title?: unknown;
    message?: unknown;
    deepLinkUrl?: unknown;
  };

  const candidates: Candidate[] = [];
  const dedupeKeys: string[] = [];

  const addCandidate = (candidate: Candidate) => {
    candidates.push(candidate);
    if (typeof candidate.dedupeKey === "string") dedupeKeys.push(candidate.dedupeKey);
  };

  if (params.action === "create") {
    const data = (params.args as any)?.data as Candidate | undefined;
    if (data) addCandidate(data);
  }

  if (params.action === "createMany") {
    const data = (params.args as any)?.data;
    if (Array.isArray(data)) {
      for (const row of data as Candidate[]) addCandidate(row);
    }
  }

  if (params.action === "upsert") {
    const createData = (params.args as any)?.create as Candidate | undefined;
    const where = (params.args as any)?.where as { dedupeKey?: unknown } | undefined;
    const dedupeKeyFromWhere = where?.dedupeKey;
    if (createData) {
      addCandidate({ ...createData, dedupeKey: createData.dedupeKey ?? dedupeKeyFromWhere });
    }
  }

  const uniqueDedupeKeys = Array.from(new Set(dedupeKeys)).filter(Boolean);
  const existing = uniqueDedupeKeys.length
    ? await prisma.notification.findMany({
        where: { dedupeKey: { in: uniqueDedupeKeys } },
        select: { dedupeKey: true }
      })
    : [];
  const existingSet = new Set(existing.map((e) => e.dedupeKey));

  // Which candidates are new (not present before we attempted the write)
  const newCandidates = candidates.filter((c) => typeof c.dedupeKey === "string" && !existingSet.has(c.dedupeKey));

  const result = await next(params);

  if (newCandidates.length === 0) return result;

  // Non-blocking: send pushes best-effort.
  void (async () => {
    try {
      // Group tokens by userId to reduce DB calls.
      const userIds = Array.from(new Set(newCandidates.map((c) => c.userId).filter((id): id is string => typeof id === "string")));
      const now = new Date();
      const tokensByUserId = new Map<string, string[]>();

      await Promise.all(
        userIds.map(async (userId) => {
          const rows = await prisma.deviceToken.findMany({
            where: { userId, expiresAt: { gt: now } },
            select: { tokenHash: true }
          });
          tokensByUserId.set(userId, rows.map((r) => r.tokenHash));
        })
      );

      const tasks = newCandidates.map(async (c) => {
        const userId = typeof c.userId === "string" ? c.userId : null;
        if (!userId) return;
        const tokens = tokensByUserId.get(userId) ?? [];
        if (!tokens.length) return;

        const title = typeof c.title === "string" ? c.title : "VAEL Update";
        const body = typeof c.message === "string" ? c.message : "";
        if (!body) return;

        await sendFcmLegacyPush({
          tokens,
          title,
          body,
          deepLinkUrl: typeof c.deepLinkUrl === "string" ? c.deepLinkUrl : "/alerts"
        });
      });

      await Promise.allSettled(tasks);
    } catch {
      // Silent best-effort.
    }
  })();

  return result;
});

export function registerPrismaShutdown() {
  if (shutdownRegistered) return;
  shutdownRegistered = true;

  const shutdown = async () => {
    await prisma.$disconnect();
  };

  process.on("beforeExit", shutdown);
  process.on("SIGINT", async () => {
    await shutdown();
    process.exit(0);
  });
  process.on("SIGTERM", async () => {
    await shutdown();
    process.exit(0);
  });
}
