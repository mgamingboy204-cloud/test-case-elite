-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('PHONE_NUMBER', 'OFFLINE_MEET', 'ONLINE_MEET', 'SOCIAL_EXCHANGE');

-- AlterTable
ALTER TABLE "Consent"
ADD COLUMN "type" "ConsentType" NOT NULL DEFAULT 'PHONE_NUMBER',
ADD COLUMN "payload" JSONB;

-- Replace old unique and indexes
DROP INDEX IF EXISTS "Consent_matchId_userId_key";
CREATE UNIQUE INDEX "Consent_matchId_userId_type_key" ON "Consent"("matchId", "userId", "type");
CREATE INDEX "Consent_matchId_type_idx" ON "Consent"("matchId", "type");

-- CreateTable
CREATE TABLE "OfflineMeetEvent" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "details" JSONB,
  CONSTRAINT "OfflineMeetEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OnlineMeetEvent" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "details" JSONB,
  CONSTRAINT "OnlineMeetEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SocialExchangeEvent" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "details" JSONB,
  CONSTRAINT "SocialExchangeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfflineMeetEvent_matchId_key" ON "OfflineMeetEvent"("matchId");
CREATE UNIQUE INDEX "OnlineMeetEvent_matchId_key" ON "OnlineMeetEvent"("matchId");
CREATE UNIQUE INDEX "SocialExchangeEvent_matchId_key" ON "SocialExchangeEvent"("matchId");

-- AddForeignKey
ALTER TABLE "OfflineMeetEvent" ADD CONSTRAINT "OfflineMeetEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OnlineMeetEvent" ADD CONSTRAINT "OnlineMeetEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SocialExchangeEvent" ADD CONSTRAINT "SocialExchangeEvent_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
