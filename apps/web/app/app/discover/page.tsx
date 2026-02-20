"use client";

import { LegacyRedirectPage } from "@/app/components/LegacyRedirectPage";

export default function DiscoverRedirectPage() {
  return (
    <LegacyRedirectPage
      to="/discover"
      title="Redirecting to Discover"
      description="Discover is available at /discover."
    />
  );
}
