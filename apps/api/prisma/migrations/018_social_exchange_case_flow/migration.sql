ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SOCIAL_EXCHANGE_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SOCIAL_EXCHANGE_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SOCIAL_EXCHANGE_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SOCIAL_EXCHANGE_HANDLE_READY';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SOCIAL_EXCHANGE_VIEWED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SOCIAL_EXCHANGE_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SOCIAL_EXCHANGE_RESEND_AVAILABLE';

CREATE TYPE "SocialExchangeStatus" AS ENUM (
  'REQUESTED',
  'ACCEPTED',
  'REJECTED',
  'AWAITING_HANDLE_SUBMISSION',
  'HANDLE_SUBMITTED',
  'READY_TO_REVEAL',
  'REVEALED',
  'EXPIRED',
  'COOLDOWN',
  'CANCELED'
);

CREATE TYPE "SocialPlatform" AS ENUM ('SNAPCHAT', 'INSTAGRAM', 'LINKEDIN');

CREATE TABLE "SocialExchangeCase" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "requesterUserId" TEXT NOT NULL,
  "receiverUserId" TEXT NOT NULL,
  "status" "SocialExchangeStatus" NOT NULL DEFAULT 'REQUESTED',
  "platform" "SocialPlatform",
  "handleValue" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3),
  "revealOpenedAt" TIMESTAMP(3),
  "revealExpiresAt" TIMESTAMP(3),
  "unopenedExpiresAt" TIMESTAMP(3),
  "expiredAt" TIMESTAMP(3),
  "cooldownUntil" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "canceledByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SocialExchangeCase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SocialExchangeCase_matchId_createdAt_idx" ON "SocialExchangeCase"("matchId", "createdAt" DESC);
CREATE INDEX "SocialExchangeCase_requesterUserId_status_idx" ON "SocialExchangeCase"("requesterUserId", "status");
CREATE INDEX "SocialExchangeCase_receiverUserId_status_idx" ON "SocialExchangeCase"("receiverUserId", "status");

ALTER TABLE "SocialExchangeCase" ADD CONSTRAINT "SocialExchangeCase_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SocialExchangeCase" ADD CONSTRAINT "SocialExchangeCase_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SocialExchangeCase" ADD CONSTRAINT "SocialExchangeCase_receiverUserId_fkey" FOREIGN KEY ("receiverUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
