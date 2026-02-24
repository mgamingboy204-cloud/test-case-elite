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
import { getPwaDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";

export default function AppLoginPage() {
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
  const [otpRequired, setOtpRequired] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) errs.phone = "Enter a valid 10-digit phone number";
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
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
          rememberDevice30Days: rememberDevice
        } as never,
        auth: "omit"
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
      router.push(getPwaDefaultRoute(user));
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    try {
      const shouldRememberSession = rememberMe || rememberDevice;
      const verificationResponse = await apiFetch<{ accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, ""), code, rememberMe: shouldRememberSession } as never,
        auth: "omit"
      });
      if (verificationResponse?.accessToken) {
        resetAuthFailureState();
        setAccessToken(verificationResponse.accessToken);
      }
      const user = await refresh();
      addToast("Verified!", "success");
      router.push(getPwaDefaultRoute(user));
    } catch {
      addToast("Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-card">
      <div className="auth-form-inner">
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Sign in to your account</p>
        {!otpRequired ? (
          <>
            <div className="field-stack">
              <Input label="Phone Number" type="tel" placeholder="1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} maxLength={10} inputMode="numeric" />
              <div style={{ position: "relative" }}>
                <Input label="Password" type={showPassword ? "text" : "password"} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="show-password">{showPassword ? "Hide" : "Show"}</button>
              </div>
              <div className="check-stack">
                <label className="check-row"><input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ accentColor: "var(--primary)", width: 16, height: 16 }} />Remember me</label>
                <label className="check-row"><input type="checkbox" checked={rememberDevice} onChange={(e) => setRememberDevice(e.target.checked)} style={{ accentColor: "var(--primary)", width: 16, height: 16 }} />Remember this device for 30 days</label>
              </div>
            </div>
            <Button fullWidth size="lg" loading={loading} onClick={handleLogin}>Sign In</Button>
            <div className="auth-links">
              <Link href="/pwa_app/get-started" className="otp-link">Need help signing in?</Link>
              <p className="switch-link-wrap">{"Don't have an account? "}<Link href="/pwa_app/signup/phone" className="switch-link">Sign Up</Link></p>
            </div>
          </>
        ) : (
          <div className="otp-stack">
            <p className="otp-copy">Enter the 6-digit code sent to your phone</p>
            <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
            <ResendTimer onResend={handleSendOtp} />
            <button onClick={() => setOtpRequired(false)} className="back-link">Back to login</button>
          </div>
        )}
      </div>
    </div>
  );
}
