"use client";

import { LegacyRedirectPage } from "@/app/components/LegacyRedirectPage";

export default function BrowsePage() {
  return (
    <LegacyRedirectPage
      to="/discover"
      title="Opening Discover"
      description="Browse has been consolidated into the primary Discover experience."
    />
  );
}
