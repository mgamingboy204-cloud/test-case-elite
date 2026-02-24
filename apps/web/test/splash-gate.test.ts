import { describe, expect, it } from "vitest";
import { isStandaloneFromDeps } from "../lib/displayMode";
import { getSplashFallbackRoute, resolveSplashDestination } from "../lib/splashGate";

describe("splash gate", () => {
  it("detects standalone mode from stable deps", () => {
    expect(isStandaloneFromDeps({ matchMediaStandalone: true, iosStandalone: false })).toBe(true);
    expect(isStandaloneFromDeps({ matchMediaStandalone: false, iosStandalone: true })).toBe(true);
    expect(isStandaloneFromDeps({ matchMediaStandalone: false, iosStandalone: false })).toBe(false);
  });

  it("uses context-specific fallback routes", () => {
    expect(getSplashFallbackRoute(false)).toBe("/login");
    expect(getSplashFallbackRoute(true)).toBe("/pwa_app/get-started");
  });

  it("resolves desktop + pwa destinations from auth status", () => {
    expect(resolveSplashDestination("logged-out", null, false)).toBe("/login");
    expect(resolveSplashDestination("logged-out", null, true)).toBe("/pwa_app/get-started");
    expect(resolveSplashDestination("logged-in", { onboardingStep: "ACTIVE", profileCompletedAt: "2026-01-01" } as any, false)).toBe("/discover");
  });
});
