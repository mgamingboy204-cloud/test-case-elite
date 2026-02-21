ALTER TABLE "Profile"
  ADD COLUMN IF NOT EXISTS "intent" TEXT NOT NULL DEFAULT 'dating';

ALTER TABLE "Profile"
  DROP COLUMN IF EXISTS "preferences",
  DROP COLUMN IF EXISTS "genderPreference";
