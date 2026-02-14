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
import { resolvePostAuthRoute } from "@/lib/authRouting";
import type { SessionUser } from "@/lib/session";

type Step = "register" | "otp";

export default function SignupPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [step, setStep] = useState<Step>("register");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) errs.phone = "Enter a valid 10-digit phone number";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email";
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
        body: { phone: phone.replace(/\D/g, ""), email: email || undefined, password } as never,
        auth: "omit"
      });
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, "") } as never,
        auth: "omit"
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
      const verifyResult = await apiFetch<{ ok: boolean; accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, ""), code } as never,
        auth: "omit"
      });
      if (verifyResult.accessToken) {
        setAccessToken(verifyResult.accessToken);
      }
      addToast("Phone verified!", "success");
      router.push(await resolvePostAuthRoute((verifyResult as { user?: SessionUser }).user ?? null));
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
        auth: "omit"
      });
      addToast("OTP resent", "info");
    } catch {
      addToast("Failed to resend", "error");
    }
  };

  return (
    <div className="premium-page-enter" style={{ width: "min(460px, 100%)" }}>
      <PremiumCard className="auth-card">
        <h1>Create account</h1>
        <p className="auth-card__subtitle">
          {step === "register" ? "Join the most exclusive dating community" : "Verify your phone number"}
        </p>

        <div className="auth-stepbar" aria-hidden="true">
          {["register", "otp"].map((s) => (
            <span key={s} className={step === s || (step === "otp" && s === "register") ? "is-active" : ""} />
          ))}
        </div>

        {step === "register" ? (
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
              <PremiumInput
                label="Email (optional)"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
              <PremiumInput
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
              />
              <PremiumInput
                label="Confirm Password"
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={errors.confirmPassword}
              />
            </div>

            <PremiumButton fullWidth onClick={handleRegister} loading={loading}>
              Create Account
            </PremiumButton>

            <p className="auth-links auth-links--single">
              Already have an account? <Link href="/login">Sign In</Link>
            </p>
          </>
        ) : (
          <div className="auth-otp-wrap">
            <p>Enter the 6-digit code sent to your phone</p>
            <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
            <ResendTimer onResend={handleResendOtp} />
          </div>
        )}
      </PremiumCard>
    </div>
  );
}
