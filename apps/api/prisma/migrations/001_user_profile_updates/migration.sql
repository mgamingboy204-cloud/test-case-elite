ALTER TYPE "Gender" ADD VALUE IF NOT EXISTS 'NON_BINARY';
ALTER TYPE "GenderPreference" ADD VALUE IF NOT EXISTS 'NON_BINARY';

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "firstName" TEXT,
ADD COLUMN IF NOT EXISTS "lastName" TEXT,
ADD COLUMN IF NOT EXISTS "displayName" TEXT,
ADD COLUMN IF NOT EXISTS "gender" "Gender";

UPDATE "User"
SET "displayName" = "Profile"."name",
    "gender" = "Profile"."gender"
FROM "Profile"
WHERE "Profile"."userId" = "User"."id"
  AND ("User"."displayName" IS NULL OR "User"."gender" IS NULL);
