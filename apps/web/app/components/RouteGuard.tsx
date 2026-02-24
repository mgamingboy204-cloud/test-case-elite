"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "../../lib/session";
import { getOnboardingRoute } from "../../lib/onboarding";
import { FUNNEL_ROUTES, isAppRoute, nextRequiredRoute } from "../../lib/funnelRoutes";

type RouteGuardProps = {
  children: ReactNode;
  requireAdmin?: boolean;
  requireActive?: boolean;
  allowedOnboardingSteps?: string[];
  autoRefreshMs?: number;
};

export default function RouteGuard({
  children,
  requireAdmin = false,
  requireActive = false,
  allowedOnboardingSteps,
  autoRefreshMs = 0
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
      router.replace(FUNNEL_ROUTES.getStarted);
      return;
    }
    if (status === "logged-in") {
      const requiredRoute = nextRequiredRoute(user);
      if (requiredRoute !== FUNNEL_ROUTES.app && isAppRoute(pathname)) {
        router.replace(requiredRoute);
        return;
      }
      if (requiredRoute === FUNNEL_ROUTES.app && pathname?.startsWith("/onboarding")) {
        router.replace(FUNNEL_ROUTES.app);
        return;
      }
    }
    if (status === "logged-in" && user?.onboardingStep) {
      const target = getOnboardingRoute(user.onboardingStep);
      if (requireActive && user.onboardingStep !== "ACTIVE") {
        router.replace(target);
        return;
      }
      if (allowedOnboardingSteps && !allowedOnboardingSteps.includes(user.onboardingStep)) {
        router.replace(target);
        return;
      }
      if (allowedOnboardingSteps && pathname && pathname.startsWith("/onboarding") && pathname !== target) {
        router.replace(target);
        return;
      }
    }
    if (requireAdmin && status === "logged-in" && user?.role !== "ADMIN" && !user?.isAdmin) {
      router.replace("/");
    }
  }, [status, requireAdmin, requireActive, allowedOnboardingSteps, user, router, pathname]);

  if (status === "loading") {
    return <>{children}</>;
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
