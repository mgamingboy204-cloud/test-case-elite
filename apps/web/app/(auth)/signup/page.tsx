"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { OtpInput, ResendTimer } from "@/app/components/OtpInput";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { useToast } from "@/app/providers";
import { isStandaloneDisplayMode } from "@/lib/displayMode";
import { ApiError } from "@/lib/apiClient";
import { apiFetch, resetAuthFailureState } from "@/lib/api";
import { setAccessToken } from "@/lib/authToken";
import { getDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";

type Step = "phone" | "otp" | "password";

const PHONE_STORAGE_KEY = "em_signup_phone";
const TOKEN_STORAGE_KEY = "em_signup_token";

export default function SignupPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isMobileUi, setIsMobileUi] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const applyMode = () => {
      setIsMobileUi(media.matches || isStandaloneDisplayMode());
    };
    applyMode();
    media.addEventListener("change", applyMode);
    return () => media.removeEventListener("change", applyMode);
  }, []);

  useLayoutEffect(() => {
    if (!isMobileUi) return;
    document.body.classList.add("app-entry-no-scroll");
    const authShell = document.querySelector(".auth-shell");
    const authTopRow = document.querySelector(".top-row");
    const authPanel = document.querySelector(".auth-panel");
    authShell?.classList.add("auth-shell--mobile-entry");
    authTopRow?.classList.add("top-row--mobile-entry");
    authPanel?.classList.add("auth-panel--mobile-sheet");
    return () => {
      document.body.classList.remove("app-entry-no-scroll");
      authShell?.classList.remove("auth-shell--mobile-entry");
      authTopRow?.classList.remove("top-row--mobile-entry");
      authPanel?.classList.remove("auth-panel--mobile-sheet");
    };
  }, [isMobileUi]);

  useEffect(() => {
    const storedPhone = (sessionStorage.getItem(PHONE_STORAGE_KEY) ?? "").replace(/\D/g, "");
    const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
    if (storedPhone) {
      setPhone(storedPhone);
    }
    if (storedToken && storedPhone) {
      setSignupToken(storedToken);
      setStep("password");
    } else if (storedPhone) {
      setStep("otp");
    }
  }, []);

  const cleanedPhone = useMemo(() => phone.replace(/\D/g, ""), [phone]);

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(cleanedPhone)) {
      setErrors({ phone: "Phone number must be exactly 10 digits" });
      return;
    }
    setLoading(true);
    setErrors({});
    try {
      await apiFetch("/auth/signup/start", {
        method: "POST",
        body: { phone: cleanedPhone } as never,
        auth: "omit"
      });
      sessionStorage.setItem(PHONE_STORAGE_KEY, cleanedPhone);
      setStep("otp");
      addToast("Code sent", "success");
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Could not send code";
      setErrors({ phone: message });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    try {
      const response = await apiFetch<{ signupToken: string }>("/auth/signup/verify", {
        method: "POST",
        body: { phone: cleanedPhone, code } as never,
        auth: "omit"
      });
      sessionStorage.setItem(PHONE_STORAGE_KEY, cleanedPhone);
      sessionStorage.setItem(TOKEN_STORAGE_KEY, response.signupToken);
      setSignupToken(response.signupToken);
      setStep("password");
      addToast("Phone verified", "success");
    } catch (err: unknown) {
      addToast(err instanceof ApiError ? err.message : "Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await apiFetch("/auth/signup/start", {
        method: "POST",
        body: { phone: cleanedPhone } as never,
        auth: "omit"
      });
      addToast("OTP resent", "info");
    } catch (err: unknown) {
      addToast(err instanceof ApiError ? err.message : "Could not resend OTP", "error");
    }
  };

  const handleSetPassword = async () => {
    const nextErrors: Record<string, string> = {};
    if (password.length < 8) nextErrors.password = "Password must be at least 8 characters";
    if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    if (!signupToken) nextErrors.password = "Signup session expired. Verify OTP again.";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const response = await apiFetch<{ accessToken?: string }>("/auth/signup/complete", {
        method: "POST",
        body: { signupToken, password } as never,
        auth: "omit"
      });
      if (response?.accessToken) {
        resetAuthFailureState();
        setAccessToken(response.accessToken);
      }
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      const user = await refresh();
      addToast("Account created", "success");
      router.replace(getDefaultRoute(user));
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to complete signup";
      setErrors({ password: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={isMobileUi ? "mobile-screen entry-screen auth-mobile-root" : "auth-form-card"} aria-label="Signup">
      {isMobileUi ? <div className="mobile-header" aria-hidden="true" /> : null}
      <div className={isMobileUi ? "mobile-content" : "auth-form-inner"}>
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">{step === "phone" ? "Enter your phone number" : step === "otp" ? "Verify OTP" : "Set your password"}</p>

        {step === "phone" ? (
          <>
            <Input
              label="Phone Number"
              type="tel"
              placeholder="1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={errors.phone}
              maxLength={10}
              inputMode="numeric"
              style={isMobileUi ? mobileInputStyle : inputStyle}
            />
            <Button fullWidth size="lg" loading={loading} onClick={handleSendOtp} style={isMobileUi ? mobileButtonStyle : buttonStyle}>
              Continue
            </Button>
          </>
        ) : null}

        {step === "otp" ? (
          <div className="otp-stack fade-in">
            <p className="otp-copy">OTP sent to {cleanedPhone}. Enter the 6-digit code.</p>
            <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
            <ResendTimer onResend={handleResendOtp} />
            <button onClick={() => setStep("phone")} className="back-link">Change number</button>
          </div>
        ) : null}

        {step === "password" ? (
          <div className="field-stack fade-in">
            <Input
              label="Password"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              style={isMobileUi ? mobileInputStyle : inputStyle}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              style={isMobileUi ? mobileInputStyle : inputStyle}
            />
            <Button fullWidth size="lg" loading={loading} onClick={handleSetPassword} style={isMobileUi ? mobileButtonStyle : buttonStyle}>
              Create account
            </Button>
            <button onClick={() => setStep("otp")} className="back-link">Back to OTP</button>
          </div>
        ) : null}

        <p className="switch-link-wrap">
          Already have an account? <Link href="/login" className="switch-link">Sign In</Link>
        </p>
      </div>

      <style jsx>{`
        .auth-form-card { width: 100%; }
        .auth-form-inner { padding: clamp(24px, 5vw, 34px); }
        .mobile-screen {
          position: fixed;
          inset: 0;
          height: 100vh;
          height: 100svh;
          height: 100dvh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: calc(8px + env(safe-area-inset-top, 0px)) 12px 0;
          background: linear-gradient(180deg, var(--bg2), var(--bg));
          overscroll-behavior: none;
          touch-action: manipulation;
          animation: entryPush 180ms ease-out;
        }
        .mobile-header {
          width: min(100%, 420px);
          min-height: clamp(34px, 10vh, 58px);
          margin: 0 auto;
        }
        .mobile-content {
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-radius: 28px 28px 0 0;
          border: 1px solid color-mix(in srgb, var(--border) 74%, transparent);
          border-bottom: none;
          background: linear-gradient(160deg, color-mix(in srgb, var(--surface) 88%, transparent), color-mix(in srgb, var(--surface2) 84%, transparent));
          backdrop-filter: blur(16px);
          padding: 16px 14px calc(12px + env(safe-area-inset-bottom, 0px));
        }
        .auth-title { margin-bottom: 4px; font-size: clamp(1.6rem, 7vw, 1.95rem); line-height: 1.08; }
        .auth-subtitle { color: color-mix(in srgb, var(--text) 78%, transparent); font-size: 14px; margin-bottom: 10px; }
        .field-stack, .otp-stack { display: flex; flex-direction: column; gap: 12px; }
        .otp-copy, .back-link { font-size: 14px; color: var(--muted); text-align: center; }
        .switch-link-wrap { font-size: 14px; color: var(--muted); text-align: center; margin-top: 4px; }
        .switch-link { color: var(--primary); font-weight: 600; }
        :global(.auth-shell.auth-shell--mobile-entry) {
          min-height: 100svh;
          min-height: 100dvh;
          height: 100svh;
          height: 100dvh;
          padding: 0;
        }
        :global(.auth-shell.auth-shell--mobile-entry .top-row.top-row--mobile-entry) {
          top: calc(10px + env(safe-area-inset-top, 0px));
          left: calc(14px + env(safe-area-inset-left, 0px));
          right: calc(14px + env(safe-area-inset-right, 0px));
        }
        :global(.auth-panel.auth-panel--mobile-sheet) {
          width: 100%;
          max-width: none;
          border: 0;
          border-radius: 0;
          background: transparent;
          backdrop-filter: none;
          box-shadow: none;
        }
        @media (max-height: 700px) {
          .mobile-screen { padding-top: calc(4px + env(safe-area-inset-top, 0px)); }
          .mobile-header { min-height: clamp(20px, 8vh, 34px); }
          .mobile-content { padding: 14px 12px calc(10px + env(safe-area-inset-bottom, 0px)); gap: 8px; }
          .auth-title { font-size: clamp(1.35rem, 6vw, 1.65rem); margin-bottom: 2px; }
          .auth-subtitle { font-size: 13px; margin-bottom: 8px; }
          .field-stack, .otp-stack { gap: 8px; }
          .otp-copy, .back-link, .switch-link-wrap { font-size: 13px; }
        }
        :global(.auth-mobile-root input) { font-size: 16px !important; }
        @keyframes entryPush { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </main>
  );
}

const inputStyle = {
  minHeight: 50,
  borderRadius: "14px",
  background: "color-mix(in srgb, var(--panel) 84%, transparent)",
  borderColor: "color-mix(in srgb, var(--border) 88%, transparent)",
  padding: "13px 16px"
};

const buttonStyle = {
  marginTop: 8,
  borderRadius: 999,
  background: "linear-gradient(120deg, var(--primary), var(--primary-hover))",
  color: "var(--ctaText)",
  boxShadow: "var(--shadow-md)",
  letterSpacing: "0.01em"
};

const mobileInputStyle = {
  height: 52,
  borderRadius: "16px",
  border: "1px solid color-mix(in srgb, var(--border) 72%, transparent)",
  background: "color-mix(in srgb, var(--surface) 85%, transparent)",
  padding: "0 16px",
  fontSize: 16,
  letterSpacing: "0.03em"
};

const mobileButtonStyle = {
  height: 52,
  borderRadius: 17,
  border: "none",
  fontSize: 16,
  fontWeight: 700,
  color: "var(--ctaText)",
  background: "linear-gradient(120deg, var(--primary), var(--primary-hover))"
};
