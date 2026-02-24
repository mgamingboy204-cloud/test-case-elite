"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { OtpInput, ResendTimer } from "@/app/components/OtpInput";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { useToast } from "@/app/providers";
import { ApiError } from "@/lib/apiClient";
import { apiFetch, resetAuthFailureState } from "@/lib/api";
import { setAccessToken } from "@/lib/authToken";
import { isStandaloneDisplayMode } from "@/lib/displayMode";
import { getDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";

type Step = "entry" | "phone" | "otp" | "password";

const PHONE_STORAGE_KEY = "em_signup_phone";
const TOKEN_STORAGE_KEY = "em_signup_token";

export default function SignupPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();

  const [step, setStep] = useState<Step>("entry");
  const [phone, setPhone] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMobileExperience, setIsMobileExperience] = useState(false);
  const [dir, setDir] = useState<"forward" | "backward">("forward");

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const applyMode = () => setIsMobileExperience(media.matches || isStandaloneDisplayMode());
    applyMode();
    media.addEventListener("change", applyMode);
    window.addEventListener("resize", applyMode);
    return () => {
      media.removeEventListener("change", applyMode);
      window.removeEventListener("resize", applyMode);
    };
  }, []);

  useEffect(() => {
    const storedPhone = (sessionStorage.getItem(PHONE_STORAGE_KEY) ?? "").replace(/\D/g, "");
    const storedToken = sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
    if (storedPhone) {
      setPhone(storedPhone);
    }
    if (storedToken && storedPhone) {
      setSignupToken(storedToken);
      setStep(isMobileExperience ? "password" : "password");
    } else if (storedPhone) {
      setStep(isMobileExperience ? "otp" : "otp");
    } else if (!isMobileExperience) {
      setStep("phone");
    } else {
      setStep("entry");
    }
  }, [isMobileExperience]);

  const cleanedPhone = useMemo(() => phone.replace(/\D/g, ""), [phone]);

  const goStep = (next: Exclude<Step, "entry"> | "entry", direction: "forward" | "backward" = "forward") => {
    setDir(direction);
    setStep(next);
  };

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
      goStep("otp", "forward");
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
    setErrors({});
    try {
      const response = await apiFetch<{ signupToken: string }>("/auth/signup/verify", {
        method: "POST",
        body: { phone: cleanedPhone, code } as never,
        auth: "omit"
      });
      sessionStorage.setItem(PHONE_STORAGE_KEY, cleanedPhone);
      sessionStorage.setItem(TOKEN_STORAGE_KEY, response.signupToken);
      setSignupToken(response.signupToken);
      goStep("password", "forward");
      addToast("Phone verified", "success");
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Invalid OTP";
      setErrors({ otp: message });
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

  if (!isMobileExperience) {
    return (
      <main className="auth-form-card" aria-label="Signup">
        <div className="auth-form-inner">
          <h2 className="auth-title">Create account</h2>
          <p className="auth-subtitle">{step === "phone" ? "Use your phone to begin." : step === "otp" ? "Enter the code we sent." : "Secure your account."}</p>

          {step === "phone" ? (
            <>
              <Input label="Phone Number" type="tel" placeholder="1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} maxLength={10} inputMode="numeric" style={inputStyle} wrapperStyle={fieldWrapperStyle} />
              <Button fullWidth size="lg" loading={loading} onClick={handleSendOtp} style={buttonStyle}>Continue</Button>
              <span className="inline-error-slot" aria-live="polite">{errors.phone || "\u00A0"}</span>
            </>
          ) : null}

          {step === "otp" ? (
            <div className="otp-stack fade-in">
              <p className="otp-copy">Code sent to {cleanedPhone}.</p>
              <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
              <ResendTimer onResend={handleResendOtp} />
              <button onClick={() => goStep("phone", "backward")} className="back-link">Change number</button>
            </div>
          ) : null}

          {step === "password" ? (
            <div className="field-stack fade-in">
              <Input label="Password" type="password" placeholder="Minimum 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} style={inputStyle} wrapperStyle={fieldWrapperStyle} />
              <Input label="Confirm Password" type="password" placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} style={inputStyle} wrapperStyle={fieldWrapperStyle} />
              <Button fullWidth size="lg" loading={loading} onClick={handleSetPassword} style={buttonStyle}>Create account</Button>
              <button onClick={() => goStep("otp", "backward")} className="back-link">Back to OTP</button>
            </div>
          ) : null}

          <p className="switch-link-wrap">Already have an account? <Link href="/login" className="switch-link">Sign In</Link></p>
        </div>
        <SignupStyles />
      </main>
    );
  }

  const showEntry = step === "entry";

  return (
    <main className="mobile-signup-root" aria-label="Signup mobile native flow">
      <section className={`mobile-signup-entry ${showEntry ? "is-visible" : "is-hidden"}`} aria-hidden={!showEntry}>
        <div className="mobile-entry-spacer" />
        <div className="mobile-entry-actions">
          <Button fullWidth size="lg" onClick={() => goStep("phone", "forward")} style={mobilePrimaryCta}>Create an account</Button>
          <Button fullWidth size="lg" variant="secondary" onClick={() => router.push("/login")} style={mobileSecondaryCta}>I have an account</Button>
          <p className="mobile-legal">By continuing, you agree to our <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>.</p>
        </div>
      </section>

      {step !== "entry" ? (
        <section className={`mobile-signup-sheet ${dir === "forward" ? "slide-forward" : "slide-back"}`}>
          <header className="mobile-sheet-header">
            <button className="mobile-back" onClick={() => goStep(step === "phone" ? "entry" : step === "otp" ? "phone" : "otp", "backward")} aria-label="Go back">←</button>
          </header>

          <div className="mobile-sheet-content">
            {step === "phone" ? (
              <div className="mobile-step">
                <h2>Can we get your number?</h2>
                <p>We use it to verify your profile and protect your account.</p>
                <div className="phone-row">
                  <Input label="Code" value="+1" readOnly style={countryCodeStyle} wrapperStyle={phonePartWrapStyle} />
                  <Input label="Phone number" type="tel" placeholder="1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} maxLength={10} inputMode="numeric" style={phoneStyle} wrapperStyle={phoneFieldWrapStyle} />
                </div>
                <span className="mobile-inline-error" aria-live="polite">{errors.phone || "\u00A0"}</span>
                <Button fullWidth size="lg" loading={loading} onClick={handleSendOtp} style={mobilePrimaryCta}>Continue</Button>
              </div>
            ) : null}

            {step === "otp" ? (
              <div className="mobile-step">
                <h2>Verify your number</h2>
                <p>Enter the 6-digit code sent to {cleanedPhone}.</p>
                <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
                <span className="mobile-inline-error" aria-live="polite">{errors.otp || "\u00A0"}</span>
                <ResendTimer onResend={handleResendOtp} />
              </div>
            ) : null}

            {step === "password" ? (
              <div className="mobile-step">
                <h2>Set your password</h2>
                <p>One last step to secure your account.</p>
                <Input label="Password" type="password" placeholder="Minimum 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} style={phoneStyle} wrapperStyle={fieldWrapperStyle} />
                <Input label="Confirm password" type="password" placeholder="Repeat your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} style={phoneStyle} wrapperStyle={fieldWrapperStyle} />
                <Button fullWidth size="lg" loading={loading} onClick={handleSetPassword} style={mobilePrimaryCta}>Create account</Button>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <SignupStyles mobile />
    </main>
  );
}

function SignupStyles({ mobile = false }: { mobile?: boolean }) {
  return (
    <style jsx>{`
      .auth-form-card { width: 100%; }
      .auth-form-inner { padding: clamp(24px, 5vw, 34px); }
      .auth-title { margin-bottom: 4px; font-size: clamp(1.6rem, 7vw, 1.95rem); line-height: 1.08; }
      .auth-subtitle { color: color-mix(in srgb, var(--text) 78%, transparent); font-size: 14px; margin-bottom: 10px; }
      .field-stack, .otp-stack { display: flex; flex-direction: column; gap: 12px; }
      .otp-copy, .back-link { font-size: 14px; color: var(--muted); text-align: center; }
      .inline-error-slot { min-height: 18px; color: var(--danger); font-size: 13px; margin-top: 4px; display: block; }
      .switch-link-wrap { font-size: 14px; color: var(--muted); text-align: center; margin-top: 8px; }
      .switch-link { color: var(--primary); font-weight: 600; }
      :global(.auth-form-card input) { font-size: 16px; }

      .mobile-signup-root {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 100svh;
        min-height: 100dvh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .mobile-signup-entry {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: calc(12px + env(safe-area-inset-top, 0px)) 16px calc(18px + env(safe-area-inset-bottom, 0px));
        transition: transform 280ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease-out;
      }
      .mobile-signup-entry.is-hidden {
        transform: translateY(22px);
        opacity: 0;
        pointer-events: none;
      }
      .mobile-entry-actions {
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .mobile-legal {
        font-size: 12px;
        text-align: center;
        color: var(--muted);
        margin-top: 4px;
      }
      .mobile-legal :global(a) {
        color: var(--text-secondary);
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .mobile-signup-sheet {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        min-height: min(100%, 560px);
        max-height: 100%;
        border-radius: 28px 28px 0 0;
        border: 1px solid color-mix(in srgb, var(--border) 78%, transparent);
        border-bottom: 0;
        background: linear-gradient(160deg, color-mix(in srgb, var(--surface) 94%, transparent), color-mix(in srgb, var(--surface2) 90%, transparent));
        backdrop-filter: blur(18px);
        box-shadow: 0 -22px 48px color-mix(in srgb, var(--bg) 58%, transparent);
        display: flex;
        flex-direction: column;
        padding: 0 max(14px, env(safe-area-inset-right, 0px)) calc(14px + env(safe-area-inset-bottom, 0px)) max(14px, env(safe-area-inset-left, 0px));
        animation-duration: 280ms;
        animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      .mobile-signup-sheet.slide-forward { animation-name: sheetInRight; }
      .mobile-signup-sheet.slide-back { animation-name: sheetInLeft; }
      .mobile-sheet-header { min-height: 44px; display: flex; align-items: center; }
      .mobile-back {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        font-size: 20px;
        color: var(--text);
        background: color-mix(in srgb, var(--surface2) 82%, transparent);
      }
      .mobile-sheet-content {
        display: flex;
        flex: 1;
        min-height: 0;
      }
      .mobile-step {
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: 100%;
      }
      .mobile-step h2 {
        font-size: clamp(1.35rem, 6.4vw, 1.7rem);
        line-height: 1.08;
      }
      .mobile-step p {
        font-size: 14px;
        color: var(--muted);
        margin-bottom: 4px;
      }
      .mobile-inline-error {
        min-height: 18px;
        color: var(--danger);
        font-size: 13px;
      }
      .phone-row {
        display: grid;
        grid-template-columns: 84px 1fr;
        gap: 10px;
        align-items: end;
      }
      :global(.mobile-step input), :global(.mobile-step select), :global(.mobile-step textarea) {
        font-size: 16px !important;
      }
      :global(.mobile-signup-root .otp-group input) {
        min-height: 48px;
      }

      @keyframes sheetInRight {
        from { transform: translateX(18px); opacity: 0.5; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes sheetInLeft {
        from { transform: translateX(-12px); opacity: 0.6; }
        to { transform: translateX(0); opacity: 1; }
      }

      @media (max-height: 640px) {
        .mobile-signup-entry { padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)); }
        .mobile-signup-sheet {
          min-height: min(100%, 500px);
          border-radius: 22px 22px 0 0;
        }
        .mobile-step { gap: 8px; }
        .mobile-step h2 { font-size: clamp(1.2rem, 6vw, 1.45rem); }
        .mobile-step p { font-size: 13px; margin-bottom: 0; }
      }

      @media (prefers-reduced-motion: reduce) {
        .mobile-signup-entry,
        .mobile-signup-sheet {
          transition: none;
          animation: none;
        }
      }

      ${mobile ? "" : `
      @media (max-width: 900px), (display-mode: standalone) {
        .auth-form-inner {
          padding: clamp(14px, 4.2vw, 18px) clamp(8px, 2.8vw, 12px) clamp(8px, 2.4vw, 12px);
          display: flex;
          flex-direction: column;
          min-height: min(68dvh, 480px);
          gap: 8px;
        }
        .auth-title {
          font-size: clamp(1.32rem, 5.5vw, 1.58rem);
          line-height: 1.08;
        }
        .auth-subtitle {
          font-size: var(--mobile-auth-subtitle-size);
          line-height: 1.3;
          margin-bottom: 6px;
        }
        .field-stack,
        .otp-stack {
          gap: var(--mobile-auth-gap);
        }
        .otp-copy,
        .back-link,
        .switch-link-wrap {
          font-size: 13px;
        }
        .switch-link-wrap {
          margin-top: auto;
          padding-top: 4px;
        }
      }
      `}
    `}</style>
  );
}

const inputStyle = {
  minHeight: 52,
  borderRadius: "14px",
  background: "color-mix(in srgb, var(--panel) 84%, transparent)",
  borderColor: "color-mix(in srgb, var(--border) 88%, transparent)",
  padding: "13px 16px",
  fontSize: 16
};

const buttonStyle = {
  marginTop: 8,
  borderRadius: 999,
  background: "linear-gradient(120deg, var(--primary), var(--primary-hover))",
  color: "var(--ctaText)",
  boxShadow: "var(--shadow-md)",
  letterSpacing: "0.01em"
};

const fieldWrapperStyle = {
  minHeight: 86
};

const phoneFieldWrapStyle = {
  minHeight: 80
};

const phonePartWrapStyle = {
  minHeight: 80
};

const countryCodeStyle = {
  minHeight: 52,
  borderRadius: "14px",
  fontSize: 16,
  textAlign: "center" as const,
  padding: "13px 10px",
  background: "color-mix(in srgb, var(--panel) 86%, transparent)",
  borderColor: "color-mix(in srgb, var(--border) 88%, transparent)",
};

const phoneStyle = {
  ...inputStyle,
  marginTop: 0,
};

const mobilePrimaryCta = {
  minHeight: 54,
  borderRadius: 999,
  background: "linear-gradient(120deg, var(--primary), var(--primary-hover))",
  color: "var(--ctaText)",
  boxShadow: "var(--shadow-md)",
};

const mobileSecondaryCta = {
  minHeight: 54,
  borderRadius: 999,
  border: "1px solid color-mix(in srgb, var(--primary) 56%, var(--border))",
  background: "color-mix(in srgb, var(--surface2) 70%, transparent)",
  color: "var(--text)",
};
