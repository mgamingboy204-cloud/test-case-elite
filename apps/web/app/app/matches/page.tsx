"use client";

import { LegacyRedirectPage } from "@/app/components/LegacyRedirectPage";

export default function MatchesRedirectPage() {
  return (
    <LegacyRedirectPage
      to="/matches"
      title="Redirecting to Matches"
      description="The updated matches experience is available at /matches."
    />
  );
}
