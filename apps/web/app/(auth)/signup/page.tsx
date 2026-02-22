"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const cleanedPhone = useMemo(() => phone.replace(/\D/g, ""), [phone]);

  const validateAccountStep = () => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = "Name is required";
    }

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
          name: name.trim(),
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
    <div className="auth-form-card">
      <div className="auth-form-inner">
        <h2 className="auth-title">Create account</h2>
        <p className="auth-subtitle">
          {step === "account"
            ? "Step 1: Create pending signup using phone, optional email, and password"
            : "Step 2: Verify OTP to create your user account and start onboarding"}
        </p>

        <div className="step-indicator" aria-hidden="true">
          {["account", "otp"].map((s, i) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                background: i <= (step === "account" ? 0 : 1) ? "var(--primary)" : "var(--border)",
                transition: "background 300ms ease"
              }}
            />
          ))}
        </div>

        {step === "account" ? (
          <>
            <div className="field-stack">
              <Input
                label="Full Name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                style={inputStyle}
              />
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
              <Input
                label="Email (optional)"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                style={inputStyle}
              />
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
            </div>

            <Button fullWidth size="lg" loading={loading} onClick={handleRegister} style={buttonStyle}>
              Continue to OTP Verification
            </Button>

            <p className="switch-link-wrap" style={{ marginTop: 20 }}>
              Already have an account?{" "}
              <Link href="/login" className="switch-link">
                Sign In
              </Link>
            </p>
          </>
        ) : (
          <div className="otp-stack">
            <p className="otp-copy">OTP sent to {cleanedPhone}. Enter the 6-digit code.</p>

            <label className="check-row">
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

            <button onClick={() => setStep("account")} className="back-link">
              Back to account details
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .auth-form-card {
          width: 100%;
        }
        .auth-form-inner {
          padding: clamp(24px, 5vw, 34px);
        }
        .auth-title {
          margin-bottom: 6px;
          font-size: clamp(1.6rem, 4vw, 2rem);
          line-height: 1.2;
        }
        .auth-subtitle {
          color: var(--muted);
          font-size: 0.92rem;
          margin-bottom: 20px;
        }
        .step-indicator {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }
        .field-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .otp-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .otp-copy,
        .back-link {
          font-size: 14px;
          color: var(--muted);
          text-align: center;
        }
        .check-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          cursor: pointer;
        }
        .switch-link-wrap {
          font-size: 14px;
          color: var(--muted);
          text-align: center;
        }
        .switch-link {
          color: var(--primary);
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

const inputStyle = {
  minHeight: 50,
  borderRadius: "14px",
  background: "color-mix(in srgb, var(--panel) 84%, transparent)",
  borderColor: "color-mix(in srgb, var(--border) 88%, transparent)",
  padding: "13px 16px",
};

const buttonStyle = {
  marginTop: 24,
  borderRadius: 999,
  background: "linear-gradient(120deg, var(--primary), var(--primary-hover))",
  color: "var(--ctaText)",
  boxShadow: "var(--shadow-md)",
  letterSpacing: "0.01em",
};
