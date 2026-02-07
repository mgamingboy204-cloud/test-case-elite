"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { setAccessToken } from "../../lib/authToken";
import { useSession } from "../../lib/session";
import { getDefaultRoute } from "../../lib/onboarding";
import OtpInput from "../components/OtpInput";
import Button from "../components/ui/Button";

type Status = "idle" | "loading" | "success" | "error";

type LoginResponse = { ok: boolean; otpRequired?: boolean; accessToken?: string };

type OtpVerifyResponse = { ok: boolean; accessToken?: string };

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
  const [rememberDevice30Days, setRememberDevice30Days] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const { refresh } = useSession();

  const loginMutation = useMutation({
    mutationFn: (payload: {
      phone: string;
      password: string;
      rememberDevice30Days: boolean;
      rememberMe: boolean;
    }) =>
      apiFetch<LoginResponse>("/auth/login", {
        method: "POST",
        auth: "omit",
        body: JSON.stringify(payload)
      }),
    onError: (error) => {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  });

  const resendMutation = useMutation({
    mutationFn: (payload: { phone: string }) =>
      apiFetch("/auth/otp/send", {
        method: "POST",
        auth: "omit",
        body: JSON.stringify(payload)
      }),
    onError: (error) => {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  });

  const verifyMutation = useMutation({
    mutationFn: (payload: { phone: string; code: string; rememberMe: boolean }) =>
      apiFetch<OtpVerifyResponse>("/auth/otp/verify", {
        method: "POST",
        auth: "omit",
        body: JSON.stringify(payload)
      }),
    onError: (error) => {
      setStatus("error");
      setMessage(getErrorMessage(error));
    }
  });

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth <= 768);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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
    const response = await loginMutation.mutateAsync({
      phone,
      password,
      rememberDevice30Days,
      rememberMe
    });
    if (response.otpRequired) {
      setOtpRequired(true);
      setOtpCountdown(30);
      setStatus("success");
      setMessage("OTP sent. Please enter the 6-digit code.");
      return;
    }
    setStatus("success");
    setMessage("Welcome back! Redirecting you now...");
    if (response.accessToken) {
      setAccessToken(response.accessToken);
    }
    const user = await refresh();
    const destination = getDefaultRoute(user);
    setTimeout(() => router.push(destination), 200);
  }

  async function resendOtp() {
    if (!phoneRegex.test(phone)) {
      setStatus("error");
      setMessage("Enter your phone number to request a new OTP.");
      return;
    }
    setStatus("loading");
    setMessage("Sending a new OTP...");
    await resendMutation.mutateAsync({ phone });
    setOtpCountdown(30);
    setStatus("success");
    setMessage("New OTP sent. Check your device or dev logs.");
  }

  async function verifyOtp() {
    if (!otpRegex.test(otpCode)) {
      setStatus("error");
      setMessage("OTP must be exactly 6 digits.");
      return;
    }
    setStatus("loading");
    setMessage("Verifying OTP...");
    const response = await verifyMutation.mutateAsync({ phone, code: otpCode, rememberMe });
    setStatus("success");
    setMessage("OTP verified! Redirecting...");
    if (response.accessToken) {
      setAccessToken(response.accessToken);
    }
    const user = await refresh();
    const destination = getDefaultRoute(user);
    setTimeout(() => router.push(destination), 200);
  }

  return (
    <div className="auth-layout">
      <section className="auth-visual">
        <div className="auth-visual-panel">
          <h1>ELITE MATCH</h1>
          <p>Confidence-first matchmaking with verification, privacy, and curated introductions.</p>
        </div>
      </section>

      <section className="auth-card">
        <div className="auth-card-inner">
          <div>
            <h2>Welcome back</h2>
            <p className="text-muted">Log in to continue to ELITE MATCH.</p>
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
                checked={rememberDevice30Days}
                onChange={(e) => setRememberDevice30Days(e.target.checked)}
              />
              Remember this device for 30 days
            </label>
            <label className="checkbox">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me on this device
            </label>
            <Button onClick={handleLogin} disabled={status === "loading"} fullWidth>
              {status === "loading" ? "Signing in..." : isMobile ? "Continue" : "Log in"}
            </Button>
            {otpRequired ? (
              <div className="otp-panel">
                <div className="field">
                  <label htmlFor="otp-code">OTP Code</label>
                  <OtpInput value={otpCode} onChange={setOtpCode} disabled={status === "loading"} idPrefix="otp-code" />
                </div>
                <div className="otp-actions">
                  <Button variant="secondary" onClick={resendOtp} disabled={status === "loading" || otpCountdown > 0}>
                    {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend OTP"}
                  </Button>
                  <Button onClick={verifyOtp} disabled={status === "loading"}>
                    Verify OTP
                  </Button>
                </div>
              </div>
            ) : null}
            {message ? <p className={`message ${status}`}>{message}</p> : null}
          </div>
          <div className="auth-switch">
            <span>Don’t have an account?</span>
            <button className="text-button" type="button" onClick={() => router.push("/signup")}>
              Create one
            </button>
          </div>
          <footer className="auth-footer">By continuing, you agree to our Terms and Privacy Policy.</footer>
        </div>
      </section>
    </div>
  );
}
