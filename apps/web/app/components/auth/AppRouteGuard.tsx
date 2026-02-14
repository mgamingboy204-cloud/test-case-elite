"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session";
import { isAuthRoute, isMainAppRoute, isOnboardingRoute } from "@/lib/onboarding";
import { computeNextRoute, isAppReady } from "@/lib/onboardingRoute";


export function AppRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user } = useSession();

  useEffect(() => {
    if (!pathname || status === "loading") return;

    if (status === "logged-out") {
      if (isOnboardingRoute(pathname) || isMainAppRoute(pathname) || pathname.startsWith("/admin")) {
        router.replace("/login");
      }
      return;
    }

    if (!user) return;

    const nextRoute = computeNextRoute(user);

    if (!isAppReady(user)) {
      if (pathname !== nextRoute) {
        router.replace(nextRoute);
      }
      return;
    }

    if (isOnboardingRoute(pathname) || isAuthRoute(pathname)) {
      router.replace("/app");
    }
  }, [pathname, router, status, user]);

  return null;
}
