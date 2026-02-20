"use client";

import { LegacyRedirectPage } from "@/app/components/LegacyRedirectPage";

export default function AppHome() {
  return (
    <LegacyRedirectPage
      to="/discover"
      title="Loading your dashboard"
      description="The app home route now forwards to the Discover dashboard."
    />
  );
}
