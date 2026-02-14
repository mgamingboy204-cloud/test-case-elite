"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { OtpInput, ResendTimer } from "@/app/components/OtpInput";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { setAccessToken } from "@/lib/authToken";
import { getDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";

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
      const loginResponse = await apiFetch<{ accessToken?: string; otpRequired?: boolean }>("/auth/login", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, ""), password, rememberMe, rememberDevice30Days: rememberDevice } as never,
        auth: "omit",
      });
      if (loginResponse?.otpRequired) {
        setOtpRequired(true);
        await handleSendOtp();
        return;
      }
      if (loginResponse?.accessToken) {
        setAccessToken(loginResponse.accessToken);
      }
      const user = await refresh();
      addToast("Logged in successfully!", "success");
      router.push(getDefaultRoute(user));
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
      const verificationResponse = await apiFetch<{ accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, ""), code, rememberMe } as never,
        auth: "omit",
      });
      if (verificationResponse?.accessToken) {
        setAccessToken(verificationResponse.accessToken);
      }
      const user = await refresh();
      addToast("Verified!", "success");
      router.push(getDefaultRoute(user));
    } catch {
      addToast("Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{
        maxWidth: 420,
        width: "100%",
        padding: 0,
      }}
    >
      <div style={{ padding: "32px 28px" }}>
        <h2 style={{ marginBottom: 4 }}>Welcome back</h2>
        <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 24 }}>
          Sign in to your account
        </p>

        {!otpRequired ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Input
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
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: 36,
                    fontSize: 13,
                    color: "var(--muted)",
                    fontWeight: 500,
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: "var(--primary)", width: 16, height: 16 }}
                  />
                  Remember me
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    style={{ accentColor: "var(--primary)", width: 16, height: 16 }}
                  />
                  Remember this device for 30 days
                </label>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              loading={loading}
              onClick={handleLogin}
              style={{ marginTop: 24 }}
            >
              Sign In
            </Button>

            <div
              style={{
                textAlign: "center",
                marginTop: 20,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <Link
                href="/otp"
                style={{ fontSize: 14, color: "var(--primary)", fontWeight: 500 }}
              >
                Sign in with OTP instead
              </Link>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>
                {"Don't have an account? "}
                <Link
                  href="/signup"
                  style={{ color: "var(--primary)", fontWeight: 600 }}
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </>
        ) : (
          /* OTP verification */
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center" }}>
              Enter the 6-digit code sent to your phone
            </p>
            <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
            <ResendTimer onResend={handleSendOtp} />
            <button
              onClick={() => setOtpRequired(false)}
              style={{ fontSize: 14, color: "var(--muted)", textAlign: "center" }}
            >
              Back to login
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
