"use client";

import React from "react";
import RouteGuard from "@/app/components/RouteGuard";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard
      allowedOnboardingSteps={[
        "PHONE_VERIFIED",
        "VIDEO_VERIFICATION_PENDING",
        "VIDEO_VERIFIED",
        "PAYMENT_PENDING",
        "PAID",
        "PROFILE_PENDING"
      ]}
    >
      {children}
    </RouteGuard>
  );
}
