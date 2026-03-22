import { describe, expect, it } from "vitest";
import { routeForAuthenticatedSession } from "@/lib/sessionRoutes";
import { resolveStaffRouteState } from "@/lib/staffNavigation";

describe("staff navigation", () => {
  it("routes authenticated staff to the correct dashboard home", () => {
    expect(
      routeForAuthenticatedSession({
        role: "EMPLOYEE",
        mustResetPassword: false,
      }),
    ).toBe("/employee");

    expect(
      routeForAuthenticatedSession({
        role: "ADMIN",
        mustResetPassword: false,
      }),
    ).toBe("/admin");
  });

  it("forces must-reset staff accounts through the password reset gate", () => {
    expect(
      routeForAuthenticatedSession({
        role: "EMPLOYEE",
        mustResetPassword: true,
      }),
    ).toBe("/staff/password-reset");

    expect(
      resolveStaffRouteState({
        scope: "employee",
        isAuthResolved: true,
        isAuthenticated: true,
        userRole: "EMPLOYEE",
        mustResetPassword: true,
      }),
    ).toEqual({
      status: "redirect",
      redirectTo: "/staff/password-reset",
    });
  });

  it("keeps unauthenticated staff dashboard access out of the shell", () => {
    expect(
      resolveStaffRouteState({
        scope: "admin",
        isAuthResolved: true,
        isAuthenticated: false,
      }),
    ).toEqual({
      status: "redirect",
      redirectTo: "/staff/login",
    });
  });

  it("restores valid employee and admin sessions inside the correct shell on refresh", () => {
    expect(
      resolveStaffRouteState({
        scope: "employee",
        isAuthResolved: true,
        isAuthenticated: true,
        authenticatedRoute: "/employee",
        userRole: "EMPLOYEE",
        mustResetPassword: false,
      }),
    ).toEqual({ status: "allow" });

    expect(
      resolveStaffRouteState({
        scope: "admin",
        isAuthResolved: true,
        isAuthenticated: true,
        authenticatedRoute: "/admin",
        userRole: "ADMIN",
        mustResetPassword: false,
      }),
    ).toEqual({ status: "allow" });
  });

  it("redirects wrong-role staff cleanly without sending them through login", () => {
    expect(
      resolveStaffRouteState({
        scope: "admin",
        isAuthResolved: true,
        isAuthenticated: true,
        userRole: "EMPLOYEE",
        mustResetPassword: false,
      }),
    ).toEqual({
      status: "redirect",
      redirectTo: "/employee",
    });

    expect(
      resolveStaffRouteState({
        scope: "employee",
        isAuthResolved: true,
        isAuthenticated: true,
        userRole: "ADMIN",
        mustResetPassword: false,
      }),
    ).toEqual({
      status: "redirect",
      redirectTo: "/admin",
    });
  });

  it("sends authenticated staff away from the login page without flashing the form", () => {
    expect(
      resolveStaffRouteState({
        scope: "login",
        isAuthResolved: true,
        isAuthenticated: true,
        userRole: "EMPLOYEE",
        mustResetPassword: false,
      }),
    ).toEqual({
      status: "redirect",
      redirectTo: "/employee",
    });
  });

  it("routes authenticated members away from staff-only screens back to their own app", () => {
    expect(
      resolveStaffRouteState({
        scope: "employee",
        isAuthResolved: true,
        isAuthenticated: true,
        authenticatedRoute: "/discover",
        userRole: "USER",
        mustResetPassword: false,
      }),
    ).toEqual({
      status: "redirect",
      redirectTo: "/discover",
    });
  });
});
