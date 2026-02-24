"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "../../lib/session";
import SplashScreen from "./SplashScreen";
import { getOnboardingRoute } from "../../lib/onboarding";

type RouteGuardProps = {
  children: ReactNode;
  requireAdmin?: boolean;
  requireActive?: boolean;
  allowedOnboardingSteps?: string[];
  autoRefreshMs?: number;
  loggedOutRedirect?: string;
};

export default function RouteGuard({
  children,
  requireAdmin = false,
  requireActive = false,
  allowedOnboardingSteps,
  autoRefreshMs = 0,
  loggedOutRedirect = "/login"
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user, refresh } = useSession();


  useEffect(() => {
    if (!autoRefreshMs || status !== "logged-in") return;
    const timer = window.setInterval(() => {
      void refresh();
    }, autoRefreshMs);
    return () => window.clearInterval(timer);
  }, [autoRefreshMs, status, refresh]);

  useEffect(() => {
    if (status === "logged-out") {
      router.replace(loggedOutRedirect);
      return;
    }
    if (status === "logged-in" && user?.onboardingStep) {
      const isPwaPath = Boolean(pathname && pathname.startsWith("/pwa_app"));
      const target = getOnboardingRoute(user.onboardingStep, isPwaPath);
      if (requireActive && user.onboardingStep !== "ACTIVE") {
        if (pathname !== target) {
          router.replace(target);
        }
        return;
      }
      if (allowedOnboardingSteps && !allowedOnboardingSteps.includes(user.onboardingStep)) {
        router.replace(target);
        return;
      }
      const onOnboardingPath = Boolean(pathname && (pathname.startsWith("/onboarding") || pathname.startsWith("/pwa_app/onboarding")));
      if (allowedOnboardingSteps && onOnboardingPath && pathname !== target) {
        router.replace(target);
        return;
      }
    }
    if (requireAdmin && status === "logged-in" && user?.role !== "ADMIN" && !user?.isAdmin) {
      router.replace("/");
    }
  }, [status, requireAdmin, requireActive, allowedOnboardingSteps, user, router, pathname, loggedOutRedirect]);

  if (status === "loading") {
    return <SplashScreen subtitle="Loading your experience" />;
  }

  if (status === "logged-out") {
    return (
      <div className="card">
        <h2>Authentication required</h2>
        <p className="card-subtitle">Redirecting you to sign in.</p>
      </div>
    );
  }

  if (requireAdmin && user?.role !== "ADMIN" && !user?.isAdmin) {
    return (
      <div className="card">
        <h2>Admin access required</h2>
        <p className="card-subtitle">You do not have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
