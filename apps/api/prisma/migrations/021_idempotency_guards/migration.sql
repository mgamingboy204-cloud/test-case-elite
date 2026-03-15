-- Prevent duplicate active social exchange cases per match under race conditions.
CREATE UNIQUE INDEX IF NOT EXISTS "SocialExchangeCase_matchId_active_unique"
ON "SocialExchangeCase" ("matchId")
WHERE "status" IN (
  'REQUESTED',
  'ACCEPTED',
  'AWAITING_HANDLE_SUBMISSION',
  'HANDLE_SUBMITTED',
  'READY_TO_REVEAL',
  'REVEALED'
);

-- Prevent duplicate active verification requests per user under repeated taps / retries.
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationRequest_userId_active_unique"
ON "VerificationRequest" ("userId")
WHERE "status" IN ('REQUESTED', 'ASSIGNED', 'IN_PROGRESS');
