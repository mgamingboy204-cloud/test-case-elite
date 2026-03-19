-- Add tokenVersion to support immediate invalidation of all refresh tokens for a user.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 0;

