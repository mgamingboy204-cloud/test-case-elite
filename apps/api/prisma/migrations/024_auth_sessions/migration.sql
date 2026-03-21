-- Persist refresh sessions per device/browser so logout and refresh rotation
-- are backed by server state rather than JWT tokenVersion alone.

CREATE TABLE IF NOT EXISTS "AuthSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "rememberMe" BOOLEAN NOT NULL DEFAULT false,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "revokeReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AuthSession_userId_revokedAt_expiresAt_idx"
  ON "AuthSession"("userId", "revokedAt", "expiresAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE constraint_name = 'AuthSession_userId_fkey'
      AND table_name = 'AuthSession'
  ) THEN
    ALTER TABLE "AuthSession"
      ADD CONSTRAINT "AuthSession_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
