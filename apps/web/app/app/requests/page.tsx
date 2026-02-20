"use client";

import { LegacyRedirectPage } from "@/app/components/LegacyRedirectPage";

export default function LikesRedirectPage() {
  return (
    <LegacyRedirectPage
      to="/likes"
      title="Redirecting to Likes"
      description="Requests and likes were consolidated under /likes."
    />
  );
}
