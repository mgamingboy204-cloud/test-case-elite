ALTER TABLE "Like"
ADD COLUMN "actionId" TEXT;

UPDATE "Like"
SET "actionId" = CONCAT('legacy-', "id")
WHERE "actionId" IS NULL;

ALTER TABLE "Like"
ALTER COLUMN "actionId" SET NOT NULL;

CREATE UNIQUE INDEX "Like_actionId_key" ON "Like"("actionId");
