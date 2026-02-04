import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import LoginPage from "../app/login/page";

const refreshMock = vi.fn();
const pushMock = vi.fn();
const setTokenMock = vi.fn();

vi.mock("../lib/api", () => ({
  apiFetch: vi.fn()
}));

vi.mock("../lib/session", () => ({
  useSession: () => ({
    refresh: refreshMock,
    setToken: setTokenMock,
    status: "logged-out",
    user: null
  })
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock
  })
}));

describe("Login OTP flow", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes session after OTP verification and redirects", async () => {
    const { apiFetch } = await import("../lib/api");
    const user = userEvent.setup();
    refreshMock.mockResolvedValue({ onboardingStep: "PAYMENT_PENDING" });

    (apiFetch as any)
      .mockResolvedValueOnce({ otpRequired: true })
      .mockResolvedValueOnce({ token: "session-token" });

    render(<LoginPage />);

    await user.type(screen.getByLabelText("Phone"), "5551234567");
    await user.type(screen.getByLabelText("Password"), "Password@1");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await user.type(screen.getByLabelText("OTP Code"), "123456");
    await user.click(screen.getByRole("button", { name: "Verify OTP" }));

    expect(setTokenMock).toHaveBeenCalledWith("session-token");
    expect(refreshMock).toHaveBeenCalled();
    expect(pushMock).toHaveBeenCalledWith("/onboarding/payment");
  });
});
