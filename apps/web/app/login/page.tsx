"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../lib/session";
import { getDefaultRoute } from "../../lib/onboarding";

type Status = "idle" | "loading" | "success" | "error";

const phoneRegex = /^\d{10}$/;
const otpRegex = /^\d{6}$/;

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Something went wrong. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const { refresh, setToken } = useSession();

  async function handleLogin() {
    if (!phoneRegex.test(phone)) {
      setStatus("error");
      setMessage("Phone number must be exactly 10 digits.");
      return;
    }
    if (!password) {
      setStatus("error");
      setMessage("Please enter your password.");
      return;
    }
    setStatus("loading");
    setMessage("Checking your credentials...");
    try {
      const response = await apiFetch<{ otpRequired?: boolean; token?: string }>("/auth/login", {
        method: "POST",
        auth: "omit",
        body: JSON.stringify({ phone, password, rememberDevice })
      });
      if (response.otpRequired) {
        setOtpRequired(true);
        setStatus("success");
        setMessage("OTP sent. Please enter the 6-digit code.");
      } else {
        if (response.token) {
          setToken(response.token);
        }
        setStatus("success");
        setMessage("Welcome back! Redirecting you now...");
        const user = await refresh();
        const destination = getDefaultRoute(user);
        setTimeout(() => router.push(destination), 200);
      }
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  async function resendOtp() {
    if (!phoneRegex.test(phone)) {
      setStatus("error");
      setMessage("Enter your phone number to request a new OTP.");
      return;
    }
    setStatus("loading");
    setMessage("Sending a new OTP...");
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        auth: "omit",
        body: JSON.stringify({ phone })
      });
      setStatus("success");
      setMessage("New OTP sent. Check your device or dev logs.");
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
      const response = await apiFetch<{ token: string }>("/auth/otp/verify", {
        method: "POST",
        auth: "omit",
        body: JSON.stringify({ phone, code: otpCode })
      });
      setToken(response.token);
      setStatus("success");
      setMessage("OTP verified! Redirecting...");
      const user = await refresh();
      const destination = getDefaultRoute(user);
      setTimeout(() => router.push(destination), 200);
    } catch (error) {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  }

  return (
    <div className="grid">
      <section className="card">
        <div>
          <h2>Sign in</h2>
          <p className="card-subtitle">Secure access with OTP-protected login.</p>
        </div>
        <div className="form">
          <div className="field">
            <label htmlFor="login-phone">Phone</label>
            <input
              id="login-phone"
              placeholder="10-digit phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              placeholder="••••••••"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
            />
            Remember this device for 30 days
          </label>
          <button onClick={handleLogin} disabled={status === "loading"}>
            {status === "loading" ? "Signing in..." : "Login"}
          </button>
          {otpRequired ? (
            <div className="otp-panel">
              <div className="field">
                <label htmlFor="otp-code">OTP Code</label>
                <input
                  id="otp-code"
                  placeholder="6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                />
              </div>
              <div className="otp-actions">
                <button className="secondary" onClick={resendOtp} disabled={status === "loading"}>
                  Resend OTP
                </button>
                <button onClick={verifyOtp} disabled={status === "loading"}>
                  Verify OTP
                </button>
              </div>
            </div>
          ) : null}
          {message ? <p className={`message ${status}`}>{message}</p> : null}
        </div>
      </section>
      <section className="card muted">
        <h3>Need an account?</h3>
        <p className="card-subtitle">Start your premium onboarding in minutes.</p>
        <button className="secondary" onClick={() => router.push("/signup")}>
          Go to Sign Up
        </button>
      </section>
    </div>
  );
}
