-- Add richer verification request lifecycle for human-managed video verification.
ALTER TYPE "VerificationRequestStatus" ADD VALUE IF NOT EXISTS 'ASSIGNED';
ALTER TYPE "VerificationRequestStatus" ADD VALUE IF NOT EXISTS 'TIMED_OUT';

ALTER TABLE "VerificationRequest"
  ADD COLUMN IF NOT EXISTS "assignedEmployeeId" TEXT,
  ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "VerificationRequest_status_createdAt_idx"
  ON "VerificationRequest"("status", "createdAt" DESC);
