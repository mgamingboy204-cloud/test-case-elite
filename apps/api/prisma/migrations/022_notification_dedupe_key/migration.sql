-- Add deterministic dedupe key for notifications.
-- Postgres UNIQUE indexes allow multiple NULLs, so the previous composite unique index
-- cannot prevent duplicates when actorUserId or matchId are NULL.

ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "dedupeKey" TEXT;

UPDATE "Notification"
SET "dedupeKey" = CONCAT(
  "userId",
  ':',
  "type"::text,
  ':',
  COALESCE("actorUserId", 'none'),
  ':',
  COALESCE("matchId", 'none')
)
WHERE "dedupeKey" IS NULL;

-- Remove existing duplicates by keeping the newest row per dedupeKey.
WITH ranked AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "dedupeKey" ORDER BY "createdAt" DESC, "id" DESC) AS rn
  FROM "Notification"
  WHERE "dedupeKey" IS NOT NULL
)
DELETE FROM "Notification"
WHERE "id" IN (SELECT "id" FROM ranked WHERE rn > 1);

ALTER TABLE "Notification"
  ALTER COLUMN "dedupeKey" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Notification_dedupeKey_key" ON "Notification"("dedupeKey");

