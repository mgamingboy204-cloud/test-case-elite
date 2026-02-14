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

type Step = "register" | "otp";

export default function SignupPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();
  const [step, setStep] = useState<Step>("register");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!/^\d{10}$/.test(phone.replace(/\D/g, "")))
      errs.phone = "Enter a valid 10-digit phone number";
    if (password.length < 8) errs.password = "Minimum 8 characters";
    if (password !== confirmPassword) errs.confirmPassword = "Passwords don't match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, ""), password } as never,
        auth: "omit",
      });

      /* Send OTP */
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, "") } as never,
        auth: "omit",
      });

      addToast("Account created! Verify your phone.", "success");
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
        body: { phone: phone.replace(/\D/g, ""), code } as never,
        auth: "omit",
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
        body: { phone: phone.replace(/\D/g, "") } as never,
        auth: "omit",
      });
      addToast("OTP resent", "info");
    } catch {
      addToast("Failed to resend", "error");
    }
  };

  return (
    <Card style={{ maxWidth: 420, width: "100%", padding: 0 }}>
      <div style={{ padding: "32px 28px" }}>
        <h2 style={{ marginBottom: 4 }}>Create account</h2>
        <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 24 }}>
          {step === "register"
            ? "Join the most exclusive dating community"
            : "Verify your phone number"}
        </p>

        {/* Step indicator */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
          }}
        >
          {["register", "otp"].map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                background:
                  i <= (step === "register" ? 0 : 1)
                    ? "var(--primary)"
                    : "var(--border)",
                transition: "background 300ms ease",
              }}
            />
          ))}
        </div>

        {step === "register" ? (
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

            <Button
              fullWidth
              size="lg"
              loading={loading}
              onClick={handleRegister}
              style={{ marginTop: 24 }}
            >
              Create Account
            </Button>

            <p
              style={{
                fontSize: 14,
                color: "var(--muted)",
                textAlign: "center",
                marginTop: 20,
              }}
            >
              Already have an account?{" "}
              <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
                Sign In
              </Link>
            </p>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ fontSize: 14, color: "var(--muted)", textAlign: "center" }}>
              Enter the 6-digit code sent to your phone
            </p>
            <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
            <ResendTimer onResend={handleResendOtp} />
          </div>
        )}
      </div>
    </Card>
  );
}
