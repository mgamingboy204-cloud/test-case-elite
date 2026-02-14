import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiEndpoints } from "../lib/apiEndpoints";

const fetchMock = vi.fn();

const mockSessionUser = {
  id: "u1",
  phone: "5551234567",
  email: null,
  firstName: null,
  lastName: null,
  displayName: null,
  gender: null,
  role: "USER",
  isAdmin: false,
  status: "PENDING",
  verifiedAt: null,
  phoneVerifiedAt: null,
  onboardingStep: "PHONE_VERIFIED",
  videoVerificationStatus: "NOT_REQUESTED",
  paymentStatus: "NOT_STARTED",
  profileCompletedAt: null,
  onboardingStatus: { nextRequiredStep: "VIDEO_VERIFICATION_REQUIRED", nextRoute: "/onboarding/video-verification" }
};

describe("apiFetch client", () => {
  const originalApiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => mockSessionUser
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBase;
    vi.unstubAllGlobals();
  });

  it("sends Authorization header without credentials by default", async () => {
    const { apiFetch } = await import("../lib/api");
    const { setAccessToken } = await import("../lib/authToken");

    setAccessToken("test-token");
    await apiFetch(apiEndpoints.me);

    const call = fetchMock.mock.calls[0];
    expect(call?.[0]).toBe("https://api.example.com/me");
    const options = call?.[1] as RequestInit;
    expect(options.credentials).toBe("omit");
    const headers = options.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("uses single-flight refresh and retries with refreshed token on 401", async () => {
    const { apiFetch } = await import("../lib/api");
    const { setAccessToken } = await import("../lib/authToken");

    setAccessToken("expired-token");

    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: { get: () => "application/json" },
        json: async () => ({ message: "Unauthorized" })
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: { get: () => "application/json" },
        json: async () => ({ message: "Unauthorized" })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: true, accessToken: "fresh-token" })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => mockSessionUser
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => mockSessionUser
      });

    await Promise.all([
      apiFetch(apiEndpoints.me, { retryOnUnauthorized: true }),
      apiFetch(apiEndpoints.me, { retryOnUnauthorized: true })
    ]);

    const refreshCalls = fetchMock.mock.calls.filter((call) => call[0] === "https://api.example.com/auth/token/refresh");
    expect(refreshCalls).toHaveLength(1);

    const retriedCalls = fetchMock.mock.calls.filter((call) => call[0] === "https://api.example.com/me").slice(-2);
    for (const [, reqOptions] of retriedCalls) {
      const headers = (reqOptions as RequestInit).headers as Headers;
      expect(headers.get("Authorization")).toBe("Bearer fresh-token");
    }
  });

  it("includes credentials for logout", async () => {
    const { apiFetch } = await import("../lib/api");
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true })
    });

    await apiFetch(apiEndpoints.authLogout, { auth: "omit" });

    const call = fetchMock.mock.calls[0];
    const options = call?.[1] as RequestInit;
    expect(options.credentials).toBe("include");
  });
});
