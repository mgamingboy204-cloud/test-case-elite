-- Phase 2 foundation: align payment plans with product pricing

-- 1) Replace PaymentPlan enum values with duration-based plans
ALTER TYPE "PaymentPlan" RENAME TO "PaymentPlan_old";

CREATE TYPE "PaymentPlan" AS ENUM ('ONE_MONTH', 'FIVE_MONTHS', 'TWELVE_MONTHS');

ALTER TABLE "Payment"
  ALTER COLUMN "plan" TYPE "PaymentPlan"
  USING (
    CASE "plan"::text
      WHEN 'YEARLY' THEN 'TWELVE_MONTHS'::"PaymentPlan"
      ELSE 'TWELVE_MONTHS'::"PaymentPlan"
    END
  );

DROP TYPE "PaymentPlan_old";

-- 2) Persist pending onboarding payment plan/amount for verification step consistency
ALTER TABLE "User"
  ADD COLUMN "onboardingPaymentPlan" "PaymentPlan",
  ADD COLUMN "onboardingPaymentAmount" INTEGER;
