DO $$
BEGIN
  CREATE TYPE "NotificationType_new" AS ENUM ('NEW_LIKE', 'NEW_MATCH', 'NEW_MESSAGE', 'SYSTEM_PROMO', 'PROFILE_VIEW', 'VIDEO_VERIFICATION_UPDATE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Notification"
  ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");

DROP TYPE IF EXISTS "NotificationType";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";

DO $$
BEGIN
  CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PREMIUM', 'ELITE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$
BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'PAST_DUE', 'CANCELED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'INACTIVE';

ALTER TABLE "Profile"
  ADD COLUMN IF NOT EXISTS "story" TEXT,
  ADD COLUMN IF NOT EXISTS "locationLabel" TEXT,
  ADD COLUMN IF NOT EXISTS "heightCm" INTEGER;

ALTER TABLE "Photo"
  ADD COLUMN IF NOT EXISTS "photoIndex" INTEGER;

CREATE TABLE IF NOT EXISTS "UserPreference" (
  "userId" TEXT NOT NULL,
  "pushNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
  "profileVisible" BOOLEAN NOT NULL DEFAULT true,
  "showOnlineStatus" BOOLEAN NOT NULL DEFAULT true,
  "discoverableByPremiumOnly" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE "Notification"
  ADD COLUMN IF NOT EXISTS "title" TEXT,
  ADD COLUMN IF NOT EXISTS "message" TEXT,
  ADD COLUMN IF NOT EXISTS "imageUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "deepLinkUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt" DESC);
