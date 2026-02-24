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
      router.push(getDefaultRoute(user));
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
        <p className="auth-subtitle">Sign in to continue.</p>

        {!otpRequired ? (
          <>
            <div className="field-stack">
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
                wrapperStyle={fieldWrapperStyle}
              />
              <div style={{ position: "relative" }}>
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  style={inputStyle}
                  wrapperStyle={fieldWrapperStyle}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="show-password"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="check-stack">
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: "var(--primary)", width: 16, height: 16 }}
                  />
                  Remember me
                </label>
                <label className="check-row">
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

            <Button fullWidth size="lg" loading={loading} onClick={handleLogin} style={buttonStyle}>
              Sign In
            </Button>

            <div className="auth-links">
              <Link href="/otp" className="otp-link">
                Sign in with OTP instead
              </Link>
              <p className="switch-link-wrap">
                {"Don't have an account? "}
                <Link href="/signup" className="switch-link">
                  Sign Up
                </Link>
              </p>
            </div>
          </>
        ) : (
          <div className="otp-stack">
            <p className="otp-copy">Enter the 6-digit code.</p>
            <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
            <ResendTimer onResend={handleSendOtp} />
            <button onClick={() => setOtpRequired(false)} className="back-link">
              Back to login
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
          font-size: clamp(1.65rem, 4vw, 2.15rem);
          line-height: 1.2;
        }
        .auth-subtitle {
          color: var(--muted);
          font-size: 0.96rem;
          margin-bottom: 24px;
        }
        .field-stack {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }
        .show-password {
          position: absolute;
          right: 14px;
          top: 39px;
          font-size: 13px;
          color: var(--muted);
          font-weight: 600;
        }
        .show-password:hover {
          color: var(--primary);
        }
        .check-stack {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .check-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: color-mix(in srgb, var(--text) 84%, var(--muted));
          cursor: pointer;
        }
        .auth-links {
          text-align: center;
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .otp-link,
        .switch-link {
          color: var(--primary);
          font-weight: 600;
        }
        .otp-link {
          font-size: 0.94rem;
        }
        .switch-link-wrap {
          font-size: 14px;
          color: var(--muted);
        }
        .otp-stack {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .otp-copy,
        .back-link {
          font-size: 14px;
          color: var(--muted);
          text-align: center;
        }

        @media (max-width: 900px), (display-mode: standalone) {
          .auth-form-inner {
            padding: clamp(14px, 4.2vw, 18px) clamp(8px, 2.8vw, 12px) clamp(8px, 2.4vw, 12px);
            display: flex;
            flex-direction: column;
            min-height: min(68dvh, 500px);
            gap: 8px;
          }
          .auth-title {
            font-size: clamp(1.32rem, 5.5vw, 1.58rem);
            line-height: 1.08;
          }
          .auth-subtitle {
            margin-bottom: 8px;
            font-size: var(--mobile-auth-subtitle-size);
            line-height: 1.3;
          }
          .field-stack,
          .check-stack,
          .auth-links,
          .otp-stack {
            gap: var(--mobile-auth-gap);
          }
          .auth-links {
            margin-top: auto;
            padding-top: 4px;
          }
          .check-row,
          .otp-link,
          .switch-link-wrap,
          .otp-copy,
          .back-link {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}

const inputStyle = {
  minHeight: 52,
  borderRadius: "14px",
  background: "color-mix(in srgb, var(--panel) 84%, transparent)",
  borderColor: "color-mix(in srgb, var(--border) 88%, transparent)",
  padding: "13px 16px",
  fontSize: 16,
};

const buttonStyle = {
  marginTop: 24,
  borderRadius: 999,
  background: "linear-gradient(120deg, var(--primary), var(--primary-hover))",
  color: "var(--ctaText)",
  boxShadow: "var(--shadow-md)",
  letterSpacing: "0.01em",
};

const fieldWrapperStyle = {
  minHeight: 86,
};
