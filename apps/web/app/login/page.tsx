"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../lib/session";
import { getDefaultRoute } from "../../lib/onboarding";
import OtpInput from "../components/OtpInput";

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
  const [rememberMe, setRememberMe] = useState(true);
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
      const response = await apiFetch<{ otpRequired?: boolean; token?: string; accessToken?: string }>(
        "/auth/login",
        {
          method: "POST",
          auth: "omit",
          body: JSON.stringify({ phone, password, rememberDevice, rememberMe })
        }
      );
      if (response.otpRequired) {
        setOtpRequired(true);
        setStatus("success");
        setMessage("OTP sent. Please enter the 6-digit code.");
      } else {
        const nextToken = response.accessToken ?? response.token;
        if (nextToken) {
          setToken(nextToken, rememberMe);
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
      const response = await apiFetch<{ token?: string; accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        auth: "omit",
        body: JSON.stringify({ phone, code: otpCode, rememberMe })
      });
      const nextToken = response.accessToken ?? response.token;
      if (nextToken) {
        setToken(nextToken, rememberMe);
      }
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
    <div className="auth-layout">
      <section className="auth-visual">
        <div className="auth-visual-panel">
          <div className="auth-badge">Elite Match</div>
          <h1>Premium introductions, crafted for you.</h1>
          <p>Secure, concierge-backed matchmaking with identity verification and curated discovery.</p>
          <div className="auth-collage">
            <div className="collage-card" />
            <div className="collage-card" />
            <div className="collage-card" />
          </div>
        </div>
      </section>

      <section className="auth-card">
        <div>
          <h2>Sign in</h2>
          <p className="card-subtitle">Welcome back. Access your introductions.</p>
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
          <label className="checkbox">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me on this device
          </label>
          <button onClick={handleLogin} disabled={status === "loading"}>
            {status === "loading" ? "Signing in..." : "Login"}
          </button>
          {otpRequired ? (
            <div className="otp-panel">
              <div className="field">
                <label htmlFor="otp-code">OTP Code</label>
                <OtpInput value={otpCode} onChange={setOtpCode} disabled={status === "loading"} idPrefix="otp-code" />
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
        <div className="auth-switch">
          <span>New here?</span>
          <button className="text-button" type="button" onClick={() => router.push("/signup")}>
            Create an account
          </button>
        </div>
        <footer className="auth-footer">Secure login • OTP protected • Concierge support</footer>
      </section>
    </div>
  );
}
