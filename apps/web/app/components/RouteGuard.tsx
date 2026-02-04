"use client";

import { ReactNode, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "../../lib/session";
import { getOnboardingRoute } from "../../lib/onboarding";

type RouteGuardProps = {
  children: ReactNode;
  requireAdmin?: boolean;
  requireActive?: boolean;
  allowedOnboardingSteps?: string[];
};

export default function RouteGuard({
  children,
  requireAdmin = false,
  requireActive = false,
  allowedOnboardingSteps
}: RouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { status, user } = useSession();

  useEffect(() => {
    if (status === "logged-out") {
      router.replace("/login");
      return;
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
    return (
      <div className="card">
        <h2>Checking your session...</h2>
        <p className="card-subtitle">Hold tight while we verify your account.</p>
      </div>
    );
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
