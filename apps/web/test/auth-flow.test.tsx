import { describe, expect, it } from "vitest";
import { getPwaDefaultRoute } from "../lib/onboarding";

describe("PWA entry routing", () => {
  it("sends logged-out users to get started", () => {
    expect(getPwaDefaultRoute(null)).toBe("/pwa_app/get-started");
  });

  it("sends active users to the canonical app", () => {
    expect(getPwaDefaultRoute({ onboardingStep: "ACTIVE" } as any)).toBe("/discover");
  });

  it("sends non-active users to onboarding", () => {
    expect(getPwaDefaultRoute({ onboardingStep: "PAYMENT_PENDING" } as any)).toBe("/onboarding/payment");
  });
});
