"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { OtpInput, ResendTimer } from "@/app/components/OtpInput";
import { useToast } from "@/app/providers";
import { apiFetch, resetAuthFailureState } from "@/lib/api";
import { setAccessToken } from "@/lib/authToken";
import { getDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* OTP state */
  const [otpRequired, setOtpRequired] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!/^\d{10}$/.test(phone.replace(/\D/g, "")))
      errs.phone = "Enter a valid 10-digit phone number";
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const shouldRememberSession = rememberMe || rememberDevice;
      const loginResponse = await apiFetch<{ accessToken?: string; otpRequired?: boolean }>("/auth/login", {
        method: "POST",
        body: {
          phone: phone.replace(/\D/g, ""),
          password,
          rememberMe: shouldRememberSession,
          rememberDevice30Days: rememberDevice,
        } as never,
        auth: "omit",
      });
      if (loginResponse?.otpRequired) {
        setOtpRequired(true);
        await handleSendOtp();
        return;
      }
      if (loginResponse?.accessToken) {
        resetAuthFailureState();
        setAccessToken(loginResponse.accessToken);
      }
      const user = await refresh();
      addToast("Logged in successfully!", "success");
      router.replace(getDefaultRoute(user));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, "") } as never,
        auth: "omit",
      });
      addToast("OTP sent to your phone", "info");
    } catch {
      addToast("Failed to send OTP", "error");
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    try {
      const shouldRememberSession = rememberMe || rememberDevice;
      const verificationResponse = await apiFetch<{ accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, ""), code, rememberMe: shouldRememberSession } as never,
        auth: "omit",
      });
      if (verificationResponse?.accessToken) {
        resetAuthFailureState();
        setAccessToken(verificationResponse.accessToken);
      }
      const user = await refresh();
      addToast("Verified!", "success");
      router.replace(getDefaultRoute(user));
    } catch {
      addToast("Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.subtitle}>Sign in to your account</p>

        {!otpRequired ? (
          <>
            <div className={styles.field}>
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
              <div className={styles.passwordField}>
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.showPassword}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className={styles.checkStack}>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className={styles.checkbox}
                  />
                  Remember me
                </label>
                <label className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className={styles.checkbox}
                  />
                  Remember this device for 30 days
                </label>
              </div>
            </div>

            <div className={styles.primaryAction}>
              <Button fullWidth size="lg" loading={loading} onClick={handleLogin} style={buttonStyle}>
                Sign In
              </Button>
            </div>

            <div className={styles.links}>
              <Link href="/otp" className={`${styles.linkPrimary} ${styles.otpLink}`}>
                Sign in with OTP instead
              </Link>
              <p className={styles.switchWrap}>
                {"Don't have an account? "}
                <Link href="/signup" className={styles.linkPrimary}>
                  Sign Up
                </Link>
              </p>
            </div>
          </>
        ) : (
          <div className={styles.otpStack}>
            <p className={styles.otpCopy}>Enter the 6-digit code sent to your phone</p>
            <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
            <ResendTimer onResend={handleSendOtp} />
            <button onClick={() => setOtpRequired(false)} className={styles.backLink}>
              Back to login
            </button>
          </div>
        )}
      </div>

    </div>
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
