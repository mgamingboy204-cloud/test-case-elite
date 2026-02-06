"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../lib/session";
import { getDefaultRoute } from "../../lib/onboarding";
import OtpInput from "../components/OtpInput";
import Button from "../components/ui/Button";

type Status = "idle" | "loading" | "success" | "error";

const phoneRegex = /^\d{10}$/;
const otpRegex = /^\d{6}$/;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong. Please try again.";
}

export default function SignupPage() {
  const router = useRouter();
  const { refresh, setToken } = useSession();
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [account, setAccount] = useState({ phone: "", email: "", password: "" });
  const [otpCode, setOtpCode] = useState("");

  async function createAccount() {
    if (!phoneRegex.test(account.phone)) {
      setStatus("error");
      setMessage("Phone number must be exactly 10 digits.");
      return;
    }
    if (!account.password) {
      setStatus("error");
      setMessage("Please choose a secure password.");
      return;
    }
    setStatus("loading");
    setMessage("Creating your account...");
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        auth: "omit",
        body: JSON.stringify({
          phone: account.phone,
          email: account.email || null,
          password: account.password
        })
      });
      setStatus("success");
      setMessage("Account created! OTP sent to your phone.");
      setStep(1);
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  async function resendOtp() {
    if (!phoneRegex.test(account.phone)) {
      setStatus("error");
      setMessage("Enter your phone number to receive an OTP.");
      return;
    }
    setStatus("loading");
    setMessage("Sending OTP...");
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        auth: "omit",
        body: JSON.stringify({ phone: account.phone })
      });
      setStatus("success");
      setMessage("OTP sent. Check your device or dev logs.");
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  async function verifyOtp() {
    if (!otpRegex.test(otpCode)) {
      setStatus("error");
      setMessage("OTP must be exactly 6 digits.");
      return;
    }
    setStatus("loading");
    setMessage("Verifying OTP...");
    try {
      const response = await apiFetch<{ token?: string; accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        auth: "omit",
        body: JSON.stringify({ phone: account.phone, code: otpCode, rememberMe })
      });
      const nextToken = response.accessToken ?? response.token;
      if (nextToken) {
        setToken(nextToken, rememberMe);
      }
      setStatus("success");
      setMessage("OTP verified. Redirecting to onboarding...");
      const user = await refresh();
      const destination = getDefaultRoute(user);
      setTimeout(() => router.push(destination), 200);
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-visual">
        <div className="auth-visual-panel">
          <h1>ELITE MATCH</h1>
          <p>Start with verification. Match with confidence and clarity.</p>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-card-inner">
          <div>
            <h2>{step === 0 ? "Create your account" : "Verify OTP"}</h2>
            <p className="text-muted">Start with verification. Match with confidence.</p>
          </div>
          {message ? <p className={`message ${status}`}>{message}</p> : null}

          {step === 0 ? (
            <div className="form">
              <div className="field">
                <label htmlFor="signup-phone">Phone</label>
                <input
                  id="signup-phone"
                  placeholder="10-digit phone number"
                  value={account.phone}
                  onChange={(e) => setAccount((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="signup-email">Email (optional)</label>
                <input
                  id="signup-email"
                  placeholder="you@example.com"
                  value={account.email}
                  onChange={(e) => setAccount((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="field">
                <label htmlFor="signup-password">Password</label>
                <input
                  id="signup-password"
                  placeholder="Create a secure password"
                  type="password"
                  value={account.password}
                  onChange={(e) => setAccount((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <Button onClick={createAccount} disabled={status === "loading"} fullWidth>
                {status === "loading" ? "Creating..." : "Create account"}
              </Button>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="form">
              <div className="field">
                <label htmlFor="signup-otp">OTP Code</label>
                <OtpInput value={otpCode} onChange={setOtpCode} disabled={status === "loading"} idPrefix="signup-otp" />
              </div>
              <div className="otp-actions">
                <Button variant="secondary" onClick={resendOtp} disabled={status === "loading"}>
                  Resend OTP
                </Button>
                <Button onClick={verifyOtp} disabled={status === "loading"}>
                  Verify OTP
                </Button>
              </div>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me on this device
              </label>
            </div>
          ) : null}

          <div className="auth-switch">
            <span>Already have an account?</span>
            <button className="text-button" type="button" onClick={() => router.push("/login")}>
              Log in
            </button>
          </div>
          <footer className="auth-footer">
            By continuing, you agree to our Terms and Privacy Policy.
          </footer>
        </div>
      </section>
    </div>
  );
}
