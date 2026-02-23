"use client";

import React, { useEffect } from "react";
import RouteGuard from "@/app/components/RouteGuard";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add("app-entry-no-scroll");
    return () => document.body.classList.remove("app-entry-no-scroll");
  }, []);

  return (
    <RouteGuard allowedOnboardingSteps={["PHONE_VERIFIED", "VIDEO_VERIFICATION_PENDING", "VIDEO_VERIFIED", "PAYMENT_PENDING", "PAID", "PROFILE_PENDING"]}>
      <div className="onboarding-shell">{children}</div>
    </RouteGuard>
  );
}
