import { describe, expect, it } from "vitest";
import { getDefaultRoute, getPwaDefaultRoute, resolveNextRoute } from "../lib/onboarding";

describe("onboarding route resolution", () => {
  it("sends logged-out users to the configured logged-out route", () => {
    expect(resolveNextRoute(null, { loggedOutRoute: "/pwa_app/get-started" })).toBe("/pwa_app/get-started");
  });

  it("sends ACTIVE users with incomplete profile to profile onboarding", () => {
    expect(getDefaultRoute({ onboardingStep: "ACTIVE", profileCompletedAt: null } as any)).toBe("/onboarding/profile");
  });

  it("sends active users to the canonical app", () => {
    expect(getPwaDefaultRoute({ onboardingStep: "ACTIVE", profileCompletedAt: "2024-01-01" } as any)).toBe("/discover");
  });

  it("sends non-active users to their exact onboarding step", () => {
    expect(getPwaDefaultRoute({ onboardingStep: "PAYMENT_PENDING" } as any)).toBe("/onboarding/payment");
    expect(getDefaultRoute({ onboardingStep: "VIDEO_VERIFICATION_PENDING" } as any)).toBe("/onboarding/video-verification");
  });
});
