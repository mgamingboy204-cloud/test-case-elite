"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { OtpInput, ResendTimer } from "@/app/components/OtpInput";
import { Button } from "@/app/components/ui/Button";
import { Input } from "@/app/components/ui/Input";
import { useToast } from "@/app/providers";
import { ApiError } from "@/lib/apiClient";
import { apiFetch, resetAuthFailureState } from "@/lib/api";
import { setAccessToken } from "@/lib/authToken";
import { getDefaultRoute, getPwaDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";
import styles from "./page.module.css";

type Step = "phone" | "otp" | "password";

const PHONE_STORAGE_KEY = "em_signup_phone";
const TOKEN_STORAGE_KEY = "em_signup_token";

export default function SignupPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const { refresh } = useSession();

  const isPwaFlow = searchParams.get("pwa") === "1";

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
      router.replace(isPwaFlow ? getPwaDefaultRoute(user) : getDefaultRoute(user));
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to complete signup";
      setErrors({ password: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.root} aria-label="Signup">
      <div className={styles.container}>
        <h2 className={styles.title}>Create account</h2>
        <p className={styles.subtitle}>{step === "phone" ? "Enter your phone number" : step === "otp" ? "Verify OTP" : "Set your password"}</p>

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
              style={inputStyle}
            />
            <div className={styles.primaryAction}>
              <Button fullWidth size="lg" loading={loading} onClick={handleSendOtp} style={buttonStyle}>
                Continue
              </Button>
            </div>
          </>
        ) : null}

        {step === "otp" ? (
          <div className={`${styles.stack} fade-in`}>
            <p className={styles.copy}>OTP sent to {cleanedPhone}. Enter the 6-digit code.</p>
            <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
            <ResendTimer onResend={handleResendOtp} />
            <button onClick={() => setStep("phone")} className={styles.backLink}>Change number</button>
          </div>
        ) : null}

        {step === "password" ? (
          <div className={`${styles.stack} fade-in`}>
            <Input
              label="Password"
              type="password"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              style={inputStyle}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              style={inputStyle}
            />
            <div className={styles.primaryAction}>
              <Button fullWidth size="lg" loading={loading} onClick={handleSetPassword} style={buttonStyle}>
                Create account
              </Button>
            </div>
            <button onClick={() => setStep("otp")} className={styles.backLink}>Back to OTP</button>
          </div>
        ) : null}

        <p className={styles.switchWrap}>
          Already have an account? <Link href={isPwaFlow ? "/pwa_app/login" : "/login"} className={styles.linkPrimary}>Sign In</Link>
        </p>
      </div>

    </main>
  );
}

const inputStyle = {
  minHeight: 50,
  borderRadius: "14px",
  background: "color-mix(in srgb, var(--panel) 84%, transparent)",
  borderColor: "color-mix(in srgb, var(--border) 88%, transparent)",
  padding: "13px 16px",
  fontSize: "var(--auth-input-font-size, 15px)",
};

const buttonStyle = {
  marginTop: 0,
  borderRadius: 999,
  background: "linear-gradient(120deg, var(--primary), var(--primary-hover))",
  color: "var(--ctaText)",
  boxShadow: "var(--shadow-md)",
  letterSpacing: "0.01em",
  minHeight: 46,
};
