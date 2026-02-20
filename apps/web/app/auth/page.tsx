"use client";

import { LegacyRedirectPage } from "@/app/components/LegacyRedirectPage";

export default function AuthPage() {
  return (
    <LegacyRedirectPage
      to="/login"
      title="Moving you to sign in"
      description="The dedicated authentication route now lives at /login."
    />
  );
}
