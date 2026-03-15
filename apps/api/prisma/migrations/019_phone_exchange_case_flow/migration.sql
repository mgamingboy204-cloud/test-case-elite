ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PHONE_EXCHANGE_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PHONE_EXCHANGE_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PHONE_EXCHANGE_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PHONE_EXCHANGE_MUTUAL_CONSENT_CONFIRMED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PHONE_EXCHANGE_REVEALED';

CREATE TYPE "PhoneExchangeCaseStatus" AS ENUM (
  'REQUESTED',
  'ACCEPTED',
  'REJECTED',
  'MUTUAL_CONSENT_CONFIRMED',
  'REVEALED',
  'CANCELED'
);

CREATE TABLE "PhoneExchangeCase" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "requesterUserId" TEXT NOT NULL,
  "receiverUserId" TEXT NOT NULL,
  "status" "PhoneExchangeCaseStatus" NOT NULL DEFAULT 'REQUESTED',
  "requesterConsented" BOOLEAN NOT NULL DEFAULT true,
  "receiverConsented" BOOLEAN NOT NULL DEFAULT false,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "acceptedAt" TIMESTAMP(3),
  "rejectedAt" TIMESTAMP(3),
  "mutuallyConfirmedAt" TIMESTAMP(3),
  "revealedAt" TIMESTAMP(3),
  "revealedByUserId" TEXT,
  "canceledAt" TIMESTAMP(3),
  "canceledByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PhoneExchangeCase_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PhoneExchangeCase_matchId_key" ON "PhoneExchangeCase"("matchId");
CREATE INDEX "PhoneExchangeCase_requesterUserId_status_idx" ON "PhoneExchangeCase"("requesterUserId", "status");
CREATE INDEX "PhoneExchangeCase_receiverUserId_status_idx" ON "PhoneExchangeCase"("receiverUserId", "status");

ALTER TABLE "PhoneExchangeCase" ADD CONSTRAINT "PhoneExchangeCase_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PhoneExchangeCase" ADD CONSTRAINT "PhoneExchangeCase_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PhoneExchangeCase" ADD CONSTRAINT "PhoneExchangeCase_receiverUserId_fkey" FOREIGN KEY ("receiverUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
