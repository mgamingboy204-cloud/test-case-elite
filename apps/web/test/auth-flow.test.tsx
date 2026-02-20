import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, afterEach } from "vitest";
import LoginPage from "../app/(auth)/login/page";

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock("../lib/api", () => ({
  apiFetch: vi.fn()
}));

vi.mock("../lib/session", () => ({
  useSession: () => ({
    refresh: refreshMock,
    status: "logged-out",
    user: null
  })
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

describe("Login flow", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes session after password login and redirects", async () => {
    const { apiFetch } = await import("../lib/api");
    const user = userEvent.setup();
    refreshMock.mockResolvedValue({ onboardingStep: "PAYMENT_PENDING" });

    (apiFetch as any).mockResolvedValueOnce({ accessToken: "token" });

    render(<LoginPage />);

    await user.type(screen.getByLabelText(/phone/i), "5551234567");
    await user.type(screen.getByLabelText(/passphrase|password/i), "Password@1");
    await user.click(screen.getByRole("button", { name: /initiate secure entry/i }));

    expect(refreshMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/onboarding/payment");
  });
});
