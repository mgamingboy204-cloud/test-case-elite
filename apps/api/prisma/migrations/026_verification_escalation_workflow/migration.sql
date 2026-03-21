CREATE TYPE "VerificationRequestStatus_new" AS ENUM (
  'PENDING',
  'ASSIGNED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'ESCALATED'
);

ALTER TABLE "VerificationRequest"
  ALTER COLUMN "status" DROP DEFAULT;

UPDATE "VerificationRequest"
SET "reason" = NULL
WHERE "status"::text = 'TIMED_OUT'
  AND ("reason" IS NULL OR "reason" = 'Timed out without employee response');

ALTER TABLE "VerificationRequest"
  ALTER COLUMN "status" TYPE "VerificationRequestStatus_new"
  USING (
    CASE
      WHEN "reason" LIKE 'WHATSAPP_HELP_REQUESTED:%' THEN 'ESCALATED'
      WHEN "status"::text = 'REQUESTED' THEN 'PENDING'
      WHEN "status"::text = 'TIMED_OUT' THEN 'PENDING'
      ELSE "status"::text
    END
  )::"VerificationRequestStatus_new";

DROP TYPE "VerificationRequestStatus";
ALTER TYPE "VerificationRequestStatus_new" RENAME TO "VerificationRequestStatus";

ALTER TABLE "VerificationRequest"
  ALTER COLUMN "status" SET DEFAULT 'PENDING';

CREATE TYPE "EscalationRequestType" AS ENUM ('VERIFICATION_WHATSAPP');
CREATE TYPE "EscalationRequestStatus" AS ENUM ('OPEN', 'RESOLVED');

CREATE TABLE "EscalationRequest" (
  "id" TEXT NOT NULL,
  "verificationRequestId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "EscalationRequestType" NOT NULL DEFAULT 'VERIFICATION_WHATSAPP',
  "status" "EscalationRequestStatus" NOT NULL DEFAULT 'OPEN',
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EscalationRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EscalationRequest_verificationRequestId_key" ON "EscalationRequest"("verificationRequestId");
CREATE INDEX "EscalationRequest_status_requestedAt_idx" ON "EscalationRequest"("status", "requestedAt");
CREATE INDEX "EscalationRequest_userId_status_idx" ON "EscalationRequest"("userId", "status");

INSERT INTO "EscalationRequest" (
  "id",
  "verificationRequestId",
  "userId",
  "type",
  "status",
  "requestedAt",
  "resolvedAt",
  "createdAt",
  "updatedAt"
)
SELECT
  md5("id" || COALESCE("reason", '') || COALESCE("updatedAt"::text, '')),
  "id",
  "userId",
  'VERIFICATION_WHATSAPP'::"EscalationRequestType",
  CASE
    WHEN "status" = 'ESCALATED' AND "assignedEmployeeId" IS NULL THEN 'OPEN'::"EscalationRequestStatus"
    ELSE 'RESOLVED'::"EscalationRequestStatus"
  END,
  COALESCE("updatedAt", "createdAt"),
  CASE
    WHEN "status" = 'ESCALATED' AND "assignedEmployeeId" IS NULL THEN NULL
    ELSE COALESCE("updatedAt", "createdAt")
  END,
  COALESCE("createdAt", CURRENT_TIMESTAMP),
  COALESCE("updatedAt", CURRENT_TIMESTAMP)
FROM "VerificationRequest"
WHERE "reason" LIKE 'WHATSAPP_HELP_REQUESTED:%';

UPDATE "VerificationRequest"
SET "reason" = NULL
WHERE "reason" LIKE 'WHATSAPP_HELP_REQUESTED:%';

ALTER TABLE "EscalationRequest"
  ADD CONSTRAINT "EscalationRequest_verificationRequestId_fkey"
  FOREIGN KEY ("verificationRequestId") REFERENCES "VerificationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EscalationRequest"
  ADD CONSTRAINT "EscalationRequest_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
