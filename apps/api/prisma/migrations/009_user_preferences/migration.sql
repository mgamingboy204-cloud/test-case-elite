-- Create user preferences table for persisted account settings
CREATE TABLE "UserPreference" (
  "userId" TEXT NOT NULL,
  "theme" TEXT NOT NULL DEFAULT 'light',
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
