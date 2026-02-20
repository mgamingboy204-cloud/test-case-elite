"use client";

import { LegacyRedirectPage } from "@/app/components/LegacyRedirectPage";

export default function VerificationPage() {
  return (
    <LegacyRedirectPage
      to="/onboarding/video-verification"
      title="Opening verification"
      description="Video verification now lives in onboarding for a single guided flow."
    />
  );
}
