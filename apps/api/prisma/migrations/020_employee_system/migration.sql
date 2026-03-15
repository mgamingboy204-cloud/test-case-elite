ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'EMPLOYEE';

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "employeeId" TEXT,
  ADD COLUMN IF NOT EXISTS "assignedEmployeeId" TEXT,
  ADD COLUMN IF NOT EXISTS "assignedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "verifiedByEmployeeId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_employeeId_key" ON "User"("employeeId");
CREATE INDEX IF NOT EXISTS "User_assignedEmployeeId_idx" ON "User"("assignedEmployeeId");
CREATE INDEX IF NOT EXISTS "User_verifiedByEmployeeId_idx" ON "User"("verifiedByEmployeeId");

ALTER TABLE "User"
  ADD CONSTRAINT "User_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User"
  ADD CONSTRAINT "User_verifiedByEmployeeId_fkey" FOREIGN KEY ("verifiedByEmployeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
