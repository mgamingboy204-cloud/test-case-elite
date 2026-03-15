ALTER TABLE "Match"
  ADD COLUMN "unmatchedAt" TIMESTAMP(3),
  ADD COLUMN "unmatchedByUserId" TEXT;

CREATE INDEX "Match_userAId_unmatchedAt_idx" ON "Match"("userAId", "unmatchedAt");
CREATE INDEX "Match_userBId_unmatchedAt_idx" ON "Match"("userBId", "unmatchedAt");
