-- CreateEnum
CREATE TYPE "OnlineMeetCoordinationStatus" AS ENUM (
  'REQUESTED',
  'ACCEPTED',
  'EMPLOYEE_PREPARING_OPTIONS',
  'OPTIONS_SENT',
  'AWAITING_USER_SELECTIONS',
  'USER_ONE_RESPONDED',
  'USER_TWO_RESPONDED',
  'READY_FOR_FINALIZATION',
  'FINALIZED',
  'NO_RESPONSE_TIMEOUT',
  'NO_COMPATIBLE_OVERLAP',
  'COOLDOWN',
  'CANCELED',
  'RESCHEDULE_REQUESTED'
);

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ONLINE_MEET_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ONLINE_MEET_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ONLINE_MEET_OPTIONS_SENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ONLINE_MEET_TIMEOUT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ONLINE_MEET_NO_OVERLAP';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ONLINE_MEET_FINALIZED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ONLINE_MEET_RESCHEDULE_UPDATE';

-- CreateTable
CREATE TABLE "OnlineMeetCase" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "requesterUserId" TEXT NOT NULL,
  "receiverUserId" TEXT NOT NULL,
  "assignedEmployeeId" TEXT,
  "status" "OnlineMeetCoordinationStatus" NOT NULL DEFAULT 'REQUESTED',
  "platformOptions" JSONB,
  "timeSlotOptions" JSONB,
  "requesterPlatformPreference" TEXT,
  "receiverPlatformPreference" TEXT,
  "requesterTimeSelections" JSONB,
  "receiverTimeSelections" JSONB,
  "optionsSentAt" TIMESTAMP(3),
  "responseDeadlineAt" TIMESTAMP(3),
  "cooldownUntil" TIMESTAMP(3),
  "timeoutUserId" TEXT,
  "finalPlatform" TEXT,
  "finalTimeSlot" JSONB,
  "finalMeetingLink" TEXT,
  "canceledAt" TIMESTAMP(3),
  "canceledByUserId" TEXT,
  "cancelReason" TEXT,
  "rescheduleRequestedByUserId" TEXT,
  "rescheduleReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OnlineMeetCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnlineMeetCase_matchId_key" ON "OnlineMeetCase"("matchId");
CREATE INDEX "OnlineMeetCase_assignedEmployeeId_status_idx" ON "OnlineMeetCase"("assignedEmployeeId", "status");
CREATE INDEX "OnlineMeetCase_requesterUserId_idx" ON "OnlineMeetCase"("requesterUserId");
CREATE INDEX "OnlineMeetCase_receiverUserId_idx" ON "OnlineMeetCase"("receiverUserId");
CREATE INDEX "OnlineMeetCase_status_responseDeadlineAt_idx" ON "OnlineMeetCase"("status", "responseDeadlineAt");

-- AddForeignKey
ALTER TABLE "OnlineMeetCase" ADD CONSTRAINT "OnlineMeetCase_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OnlineMeetCase" ADD CONSTRAINT "OnlineMeetCase_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OnlineMeetCase" ADD CONSTRAINT "OnlineMeetCase_receiverUserId_fkey" FOREIGN KEY ("receiverUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OnlineMeetCase" ADD CONSTRAINT "OnlineMeetCase_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
