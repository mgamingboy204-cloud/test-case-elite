-- Performance indexes for likes/matches/discover workflows
CREATE INDEX IF NOT EXISTS "Like_fromUserId_createdAt_idx" ON "Like" ("fromUserId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Like_toUserId_createdAt_idx" ON "Like" ("toUserId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Match_userAId_createdAt_idx" ON "Match" ("userAId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Match_userBId_createdAt_idx" ON "Match" ("userBId", "createdAt" DESC);
