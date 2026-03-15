-- Add richer payment states and subscription lifecycle tracking
ALTER TYPE "OnboardingPaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELED';

ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PENDING';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'FAILED';
ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'CANCELED';

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "subscriptionStartedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "manualRenewalRequired" BOOLEAN NOT NULL DEFAULT true;
