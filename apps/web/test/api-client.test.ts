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

  it("sends credentials and Authorization header via same-origin API path", async () => {
    const { apiFetch } = await import("../lib/api");
    const { setAccessToken } = await import("../lib/authToken");

    setAccessToken("test-token");
    await apiFetch("/me");

    const call = fetchMock.mock.calls[0];
    expect(call?.[0]).toBe("/api/me");
    const options = call?.[1] as RequestInit;
    expect(options.credentials).toBe("include");
    const headers = options.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("falls back to same-origin /api when NEXT_PUBLIC_API_BASE_URL is unset", async () => {
    vi.resetModules();
    delete process.env.NEXT_PUBLIC_API_BASE_URL;
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ ok: true })
    });
    vi.stubGlobal("fetch", fetchMock);

    const { apiFetch } = await import("../lib/api");
    await apiFetch("/me");

    const call = fetchMock.mock.calls[0];
    expect(call?.[0]).toBe("/api/me");
  });

  it("uses a single refresh request for parallel 401 responses", async () => {
    vi.resetModules();
    const { apiFetch } = await import("../lib/api");
    const { setAccessToken } = await import("../lib/authToken");

    setAccessToken("stale-token");

    let meCalls = 0;
    let refreshCalls = 0;

    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/auth/token/refresh") {
        refreshCalls += 1;
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => ({ ok: true, accessToken: "fresh-token" })
        };
      }

      if (url === "/api/me") {
        meCalls += 1;
        if (meCalls <= 2) {
          return {
            ok: false,
            status: 401,
            headers: { get: () => "application/json" },
            json: async () => ({ message: "Unauthorized" })
          };
        }
        return {
          ok: true,
          status: 200,
          headers: { get: () => "application/json" },
          json: async () => ({ ok: true })
        };
      }

      return {
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => ({ ok: true })
      };
    });

    const [one, two] = await Promise.all([
      apiFetch("/me", { retryOnUnauthorized: true }),
      apiFetch("/me", { retryOnUnauthorized: true })
    ]);

    expect(one).toEqual({ ok: true });
    expect(two).toEqual({ ok: true });
    expect(refreshCalls).toBe(1);
  });

  it("does not redirect away from auth routes when refresh is unauthorized", async () => {
    vi.resetModules();

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => "application/json" },
      json: async () => ({ message: "missing_cookie" })
    });

    const assignMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        pathname: "/login",
        assign: assignMock
      }
    });

    const { refreshAccessToken } = await import("../lib/api");
    const token = await refreshAccessToken();

    expect(token).toBeNull();
    expect(assignMock).not.toHaveBeenCalled();
  });

  it("does not redirect away from marketing routes when refresh is unauthorized", async () => {
    vi.resetModules();

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => "application/json" },
      json: async () => ({ message: "missing_cookie" })
    });

    const assignMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        pathname: "/",
        assign: assignMock
      }
    });

    const { refreshAccessToken } = await import("../lib/api");
    const token = await refreshAccessToken();

    expect(token).toBeNull();
    expect(assignMock).not.toHaveBeenCalled();
  });

});
