"use client";

import { LegacyRedirectPage } from "@/app/components/LegacyRedirectPage";

export default function PaymentRedirectPage() {
  return (
    <LegacyRedirectPage
      to="/onboarding/payment"
      title="Opening payment setup"
      description="Payment onboarding is now managed under /onboarding/payment."
    />
  );
}
