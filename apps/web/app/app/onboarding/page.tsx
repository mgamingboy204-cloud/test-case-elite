"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { getOnboardingRoute } from "@/lib/onboarding";

export default function AppOnboardingPage() {
  const router = useRouter();
  const { status, user } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "logged-out") {
      router.replace("/app/login");
      return;
    }
    router.replace(getOnboardingRoute(user?.onboardingStep ?? "PHONE_VERIFIED"));
  }, [router, status, user?.onboardingStep]);

  return null;
}
