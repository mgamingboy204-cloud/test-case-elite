import { ADMIN_ROUTES } from "@/lib/adminRoutes";
import { EMPLOYEE_ROUTES } from "@/lib/employeeRoutes";
import { STAFF_ROUTES } from "@/lib/staffRoutes";

export type StaffRole = "EMPLOYEE" | "ADMIN";
export type SessionRole = "USER" | StaffRole;
export type StaffRouteScope = "login" | "password-reset" | "employee" | "admin";

export type StaffRouteState =
  | { status: "loading" }
  | { status: "allow" }
  | { status: "redirect"; redirectTo: string };

export function isStaffRole(role?: SessionRole | null): role is StaffRole {
  return role === "EMPLOYEE" || role === "ADMIN";
}

export function routeForStaffHome(role: StaffRole) {
  return role === "ADMIN" ? ADMIN_ROUTES.home : EMPLOYEE_ROUTES.home;
}

export function resolveStaffLandingRoute(input: {
  role?: SessionRole | null;
  mustResetPassword?: boolean | null;
}) {
  if (!isStaffRole(input.role)) {
    return null;
  }

  if (input.mustResetPassword) {
    return STAFF_ROUTES.passwordReset;
  }

  return routeForStaffHome(input.role);
}

function normalizeRoute(route?: string | null) {
  return route?.startsWith("/") ? route : null;
}

export function resolveStaffRouteState(input: {
  scope: StaffRouteScope;
  isAuthResolved: boolean;
  isAuthenticated: boolean;
  authenticatedRoute?: string | null;
  userRole?: SessionRole | null;
  mustResetPassword?: boolean | null;
}): StaffRouteState {
  if (!input.isAuthResolved) {
    return { status: "loading" };
  }

  const authenticatedFallback =
    normalizeRoute(input.authenticatedRoute) ??
    resolveStaffLandingRoute({
      role: input.userRole,
      mustResetPassword: input.mustResetPassword,
    }) ??
    "/discover";

  if (input.scope === "login") {
    if (!input.isAuthenticated || !input.userRole) {
      return { status: "allow" };
    }

    return {
      status: "redirect",
      redirectTo: authenticatedFallback,
    };
  }

  if (!input.isAuthenticated || !input.userRole) {
    return {
      status: "redirect",
      redirectTo: STAFF_ROUTES.login,
    };
  }

  if (!isStaffRole(input.userRole)) {
    return {
      status: "redirect",
      redirectTo: authenticatedFallback,
    };
  }

  if (input.scope === "password-reset") {
    if (input.mustResetPassword) {
      return { status: "allow" };
    }

    return {
      status: "redirect",
      redirectTo: routeForStaffHome(input.userRole),
    };
  }

  if (input.mustResetPassword) {
    return {
      status: "redirect",
      redirectTo: STAFF_ROUTES.passwordReset,
    };
  }

  const requiredRole = input.scope === "admin" ? "ADMIN" : "EMPLOYEE";
  if (input.userRole !== requiredRole) {
    return {
      status: "redirect",
      redirectTo: routeForStaffHome(input.userRole),
    };
  }

  return { status: "allow" };
}
