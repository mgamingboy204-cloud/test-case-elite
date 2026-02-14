"use client";

import { useMemo, useState } from "react";
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

type Step = "account" | "otp";

export default function SignupPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();
  const [step, setStep] = useState<Step>("account");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const cleanedPhone = useMemo(() => phone.replace(/\D/g, ""), [phone]);

  const validateAccountStep = () => {
    const nextErrors: Record<string, string> = {};

    if (!/^\d{10}$/.test(cleanedPhone)) {
      nextErrors.phone = "Phone number must be exactly 10 digits";
    }

    if (email.trim()) {
      const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      if (!isEmailValid) {
        nextErrors.email = "Enter a valid email address";
      }
    }

    if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters";
    }

    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateAccountStep()) return;

    setLoading(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: {
          phone: cleanedPhone,
          email: email.trim() || null,
          password
        } as never,
        auth: "omit"
      });

      addToast("Account created. Verify OTP to activate your account.", "success");
      setStep("otp");
    } catch (err: unknown) {
      addToast(err instanceof Error ? err.message : "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    try {
      const verificationResponse = await apiFetch<{ accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone: cleanedPhone, code, rememberMe } as never,
        auth: "omit"
      });
      if (verificationResponse?.accessToken) {
        setAccessToken(verificationResponse.accessToken);
      }
      const user = await refresh();
      addToast("Phone verified!", "success");
      router.push(getDefaultRoute(user));
    } catch {
      addToast("Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: { phone: cleanedPhone } as never,
        auth: "omit"
      });
      addToast("OTP resent", "info");
    } catch {
      addToast("Failed to resend OTP", "error");
    }
  };

  return (
    <Card style={{ maxWidth: 440, width: "100%", padding: 0 }}>
      <div style={{ padding: "32px 28px" }}>
        <h2 style={{ marginBottom: 4 }}>Create account</h2>
        <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 20 }}>
          {step === "account"
            ? "Step 1: Create pending signup using phone, optional email, and password"
            : "Step 2: Verify OTP to create your user account and start onboarding"}
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {["account", "otp"].map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background: i <= (step === "account" ? 0 : 1) ? "var(--primary)" : "var(--border)",
                transition: "background 300ms ease"
              }}
            />
          ))}
        </div>

        {step === "account" ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
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
              <Input
                label="Email (optional)"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
              <Input
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
              />
            </div>

            <Button fullWidth size="lg" loading={loading} onClick={handleRegister} style={{ marginTop: 24 }}>
              Continue to OTP Verification
            </Button>

            <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center", marginTop: 20 }}>
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
                Sign In
              </Link>
            </p>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center" }}>
              OTP sent to {cleanedPhone}. Enter the 6-digit code.
            </p>

            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: "var(--primary)", width: 16, height: 16 }}
              />
              Keep me signed in on this device
            </label>

            <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
            <ResendTimer onResend={handleResendOtp} />

            <button
              onClick={() => setStep("account")}
              style={{ fontSize: 14, color: "var(--muted)", textAlign: "center" }}
            >
              Back to account details
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
