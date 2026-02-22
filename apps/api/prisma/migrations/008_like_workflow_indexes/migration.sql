-- Support likes tabs and discover feed query patterns
CREATE INDEX IF NOT EXISTS "Like_toUserId_type_createdAt_idx" ON "Like" ("toUserId", "type", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Like_fromUserId_type_createdAt_idx" ON "Like" ("fromUserId", "type", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Like_fromUserId_toUserId_idx" ON "Like" ("fromUserId", "toUserId");
