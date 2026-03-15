-- CreateEnum
CREATE TYPE "OfflineMeetCoordinationStatus" AS ENUM (
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
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OFFLINE_MEET_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OFFLINE_MEET_ACCEPTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OFFLINE_MEET_OPTIONS_SENT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OFFLINE_MEET_TIMEOUT';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OFFLINE_MEET_NO_OVERLAP';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OFFLINE_MEET_FINALIZED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'OFFLINE_MEET_RESCHEDULE_UPDATE';

-- CreateTable
CREATE TABLE "OfflineMeetCase" (
  "id" TEXT NOT NULL,
  "matchId" TEXT NOT NULL,
  "requesterUserId" TEXT NOT NULL,
  "receiverUserId" TEXT NOT NULL,
  "assignedEmployeeId" TEXT,
  "status" "OfflineMeetCoordinationStatus" NOT NULL DEFAULT 'REQUESTED',
  "cafeOptions" JSONB,
  "timeSlotOptions" JSONB,
  "requesterCafeSelections" JSONB,
  "receiverCafeSelections" JSONB,
  "requesterTimeSelections" JSONB,
  "receiverTimeSelections" JSONB,
  "optionsSentAt" TIMESTAMP(3),
  "responseDeadlineAt" TIMESTAMP(3),
  "cooldownUntil" TIMESTAMP(3),
  "timeoutUserId" TEXT,
  "finalCafe" JSONB,
  "finalTimeSlot" JSONB,
  "canceledAt" TIMESTAMP(3),
  "canceledByUserId" TEXT,
  "cancelReason" TEXT,
  "rescheduleRequestedByUserId" TEXT,
  "rescheduleReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OfflineMeetCase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OfflineMeetCase_matchId_key" ON "OfflineMeetCase"("matchId");
CREATE INDEX "OfflineMeetCase_assignedEmployeeId_status_idx" ON "OfflineMeetCase"("assignedEmployeeId", "status");
CREATE INDEX "OfflineMeetCase_requesterUserId_idx" ON "OfflineMeetCase"("requesterUserId");
CREATE INDEX "OfflineMeetCase_receiverUserId_idx" ON "OfflineMeetCase"("receiverUserId");
CREATE INDEX "OfflineMeetCase_status_responseDeadlineAt_idx" ON "OfflineMeetCase"("status", "responseDeadlineAt");

-- AddForeignKey
ALTER TABLE "OfflineMeetCase" ADD CONSTRAINT "OfflineMeetCase_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfflineMeetCase" ADD CONSTRAINT "OfflineMeetCase_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfflineMeetCase" ADD CONSTRAINT "OfflineMeetCase_receiverUserId_fkey" FOREIGN KEY ("receiverUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OfflineMeetCase" ADD CONSTRAINT "OfflineMeetCase_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
