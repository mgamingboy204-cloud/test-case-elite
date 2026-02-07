import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

describe("apiFetch client", () => {
  const originalApiBase = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com";
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true })
    });
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBase;
    vi.unstubAllGlobals();
  });

  it("sends credentials and Authorization header", async () => {
    const { apiFetch } = await import("../lib/api");
    const { setAccessToken } = await import("../lib/authToken");

    setAccessToken("test-token");
    await apiFetch("/me");

    const call = fetchMock.mock.calls[0];
    expect(call?.[0]).toBe("https://api.example.com/me");
    const options = call?.[1] as RequestInit;
    expect(options.credentials).toBe("include");
    const headers = options.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });
});
