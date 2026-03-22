"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  resolveStaffRouteState,
  type StaffRouteScope,
} from "@/lib/staffNavigation";

export function useStaffRouteGate(scope: StaffRouteScope) {
  const pathname = usePathname();
  const router = useRouter();
  const { authenticatedRoute, isAuthenticated, isAuthResolved, user } = useAuth();

  const routeState = useMemo(
    () =>
      resolveStaffRouteState({
        scope,
        isAuthResolved,
        isAuthenticated,
        authenticatedRoute,
        userRole: user?.role ?? null,
        mustResetPassword: user?.mustResetPassword ?? false,
      }),
    [
      authenticatedRoute,
      isAuthResolved,
      isAuthenticated,
      scope,
      user?.mustResetPassword,
      user?.role,
    ],
  );

  const redirectTo =
    routeState.status === "redirect" ? routeState.redirectTo : null;

  useEffect(() => {
    if (!redirectTo || pathname === redirectTo) {
      return;
    }

    router.replace(redirectTo);
  }, [pathname, redirectTo, router]);

  return {
    routeState,
    redirectTo,
    staffUser: routeState.status === "allow" ? user : null,
    isReady: routeState.status === "allow",
    isLoading: routeState.status === "loading",
    isRedirecting: routeState.status === "redirect",
  };
}
