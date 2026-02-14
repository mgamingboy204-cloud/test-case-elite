"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import {
  getNextRequiredStep,
  getNextRouteFromStatus,
  isAdminRoute,
  isAuthRoute,
  isMainAppRoute,
  isOnboardingRoute,
} from "@/lib/onboarding";


/**
 * Manual verification plan:
 * 1) User not video-verified -> login -> redirect to /onboarding/video-verification
 * 2) Video verified but payment missing -> redirect to /onboarding/payment
 * 3) Paid but profile incomplete -> redirect to /onboarding/profile-setup
 * 4) Fully onboarded -> redirect to /app
 * 5) Onboarding user opening /app -> redirected to next required step
 * 6) Non-admin opening /admin -> redirected to /app
 * 7) Admin user sees Admin Control nav link and can open /admin
 */

export function AppRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user } = useSession();

  useEffect(() => {
    if (!pathname || status === "loading") return;

    if (status === "logged-out") {
      if (isOnboardingRoute(pathname) || isMainAppRoute(pathname) || isAdminRoute(pathname)) {
        router.replace("/login");
      }
      return;
    }

    if (!user) return;

    const nextRoute = getNextRouteFromStatus(user);
    const nextStep = getNextRequiredStep(user);

    if (isAdminRoute(pathname) && user.role !== "ADMIN" && !user.isAdmin) {
      router.replace("/app");
      return;
    }

    if (isAuthRoute(pathname)) {
      router.replace(nextRoute);
      return;
    }

    if (nextStep !== "APP_READY") {
      if (pathname !== nextRoute) {
        router.replace(nextRoute);
      }
      return;
    }

    if (isOnboardingRoute(pathname)) {
      router.replace("/app");
    }
  }, [pathname, router, status, user]);

  return null;
}
