"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OtpInput, ResendTimer } from "@/app/components/OtpInput";
import { PremiumButton } from "@/app/components/premium/PremiumButton";
import { PremiumCard } from "@/app/components/premium/PremiumCard";
import { PremiumInput } from "@/app/components/premium/PremiumInput";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { setAccessToken } from "@/lib/authToken";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpRequired, setOtpRequired] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) errs.phone = "Enter a valid 10-digit phone number";
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const loginResult = await apiFetch<{ ok: boolean; otpRequired?: boolean; accessToken?: string }>("/auth/login", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, ""), password, rememberMe: remember, rememberDevice30Days: rememberDevice } as never,
        auth: "omit"
      });
      if (loginResult.otpRequired) {
        setOtpRequired(true);
        addToast("OTP verification is required.", "info");
        return;
      }
      if (loginResult.accessToken) {
        setAccessToken(loginResult.accessToken);
      }
      addToast("Logged in successfully!", "success");
      router.push("/discover");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (msg.toLowerCase().includes("otp")) {
        setOtpRequired(true);
        handleSendOtp();
      } else {
        addToast(msg, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, "") } as never,
        auth: "omit"
      });
      addToast("OTP sent to your phone", "info");
    } catch {
      addToast("Failed to send OTP", "error");
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    try {
      const verifyResult = await apiFetch<{ ok: boolean; accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, ""), code } as never,
        auth: "omit"
      });
      if (verifyResult.accessToken) {
        setAccessToken(verifyResult.accessToken);
      }
      addToast("Verified!", "success");
      router.push("/discover");
    } catch {
      addToast("Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-page-enter" style={{ width: "min(460px, 100%)" }}>
      <PremiumCard className="auth-card">
        <h1>Welcome back</h1>
        <p className="auth-card__subtitle">Sign in to your account</p>

        {!otpRequired ? (
          <>
            <div className="auth-form-fields">
              <PremiumInput
                label="Phone Number"
                type="tel"
                placeholder="1234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
                maxLength={10}
                inputMode="numeric"
              />
              <div style={{ position: "relative" }}>
                <PremiumInput
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="auth-toggle-password">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="auth-checkboxes">
                <label>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  <span>Remember me</span>
                </label>
                <label>
                  <input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} />
                  <span>Remember this device for 30 days</span>
                </label>
              </div>
            </div>

            <PremiumButton fullWidth onClick={handleLogin} loading={loading}>
              Sign In
            </PremiumButton>

            <div className="auth-links">
              <Link href="/otp">Sign in with OTP instead</Link>
              <p>
                {"Don't have an account? "}
                <Link href="/signup">Sign Up</Link>
              </p>
            </div>
          </>
        ) : (
          <div className="auth-otp-wrap">
            <p>Enter the 6-digit code sent to your phone</p>
            <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
            <ResendTimer onResend={handleSendOtp} />
            <button type="button" onClick={() => setOtpRequired(false)} className="auth-back-button">
              Back to login
            </button>
          </div>
        )}
      </PremiumCard>
    </div>
  );
}
