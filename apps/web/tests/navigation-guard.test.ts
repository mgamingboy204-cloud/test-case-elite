import { describe, expect, it } from "vitest";
import {
  canAccessMemberMainRoute,
  hasMemberMainShellAccess,
  isEligibleMemberAppState,
  resolvePendingAuthRoute,
  resolveRouteRedirect
} from "@/lib/navigationGuard";

describe("navigation guard", () => {
  it("restores the correct pending auth route for unfinished signup and signin flows", () => {
    expect(
      resolvePendingAuthRoute({
        authFlowMode: "signup",
        pendingPhone: "+91 99999 11111",
        signupToken: "signup-token"
      })
    ).toBe("/signup/password");

    expect(
      resolvePendingAuthRoute({
        authFlowMode: "signin",
        pendingPhone: "+91 99999 11111"
      })
    ).toBe("/signin/otp");
  });

  it("redirects authenticated members away from auth screens to their canonical route", () => {
    expect(
      resolveRouteRedirect({
        pathname: "/signin",
        isAuthenticated: true,
        isAuthResolved: true,
        authenticatedRoute: "/discover",
        appStateCode: "eligible",
        appStateRedirectTo: "/discover",
        scope: "auth",
        userRole: "USER",
        mustResetPassword: false
      })
    ).toBe("/discover");
  });

  it("prevents onboarding from routing backward after the backend advances the step", () => {
    expect(
      resolveRouteRedirect({
        pathname: "/onboarding/verification",
        isAuthenticated: true,
        isAuthResolved: true,
        authenticatedRoute: "/onboarding/payment",
        appStateCode: "payment_required",
        appStateRedirectTo: "/onboarding/payment",
        scope: "onboarding",
        userRole: "USER",
        mustResetPassword: false
      })
    ).toBe("/onboarding/payment");
  });

  it("keeps eligible members inside valid main-app routes after refresh", () => {
    expect(isEligibleMemberAppState("eligible")).toBe(true);
    expect(hasMemberMainShellAccess("eligible")).toBe(true);
    expect(canAccessMemberMainRoute("/matches", "eligible")).toBe(true);

    expect(
      resolveRouteRedirect({
        pathname: "/matches",
        isAuthenticated: true,
        isAuthResolved: true,
        authenticatedRoute: "/discover",
        appStateCode: "eligible",
        appStateRedirectTo: "/discover",
        scope: "main",
        userRole: "USER",
        mustResetPassword: false
      })
    ).toBeNull();
  });

  it("limits matching-ineligible members to alerts, profile, renew, and settings", () => {
    expect(hasMemberMainShellAccess("matching_ineligible")).toBe(true);
    expect(canAccessMemberMainRoute("/alerts", "matching_ineligible")).toBe(true);
    expect(canAccessMemberMainRoute("/profile", "matching_ineligible")).toBe(true);
    expect(canAccessMemberMainRoute("/discover", "matching_ineligible")).toBe(false);

    expect(
      resolveRouteRedirect({
        pathname: "/discover",
        isAuthenticated: true,
        isAuthResolved: true,
        authenticatedRoute: "/profile",
        appStateCode: "matching_ineligible",
        appStateRedirectTo: "/profile",
        scope: "main",
        userRole: "USER",
        mustResetPassword: false
      })
    ).toBe("/profile");

    expect(
      resolveRouteRedirect({
        pathname: "/alerts",
        isAuthenticated: true,
        isAuthResolved: true,
        authenticatedRoute: "/profile",
        appStateCode: "matching_ineligible",
        appStateRedirectTo: "/profile",
        scope: "main",
        userRole: "USER",
        mustResetPassword: false
      })
    ).toBeNull();
  });

  it("sends unauthenticated protected-route access back to signin", () => {
    expect(
      resolveRouteRedirect({
        pathname: "/discover",
        isAuthenticated: false,
        isAuthResolved: true,
        scope: "main"
      })
    ).toBe("/signin");
  });
});
