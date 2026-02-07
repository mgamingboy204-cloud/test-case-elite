"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

export default function OtpPage() {
  const router = useRouter();
  const [sendPhone, setSendPhone] = useState("");
  const [sendStatus, setSendStatus] = useState<Status>("idle");
  const [sendMessage, setSendMessage] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);

  const [verifyPhone, setVerifyPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<Status>("idle");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const { refresh } = useSession();

  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setTimeout(() => setOtpCountdown((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  async function handleSendOtp() {
    if (!phoneRegex.test(sendPhone)) {
      setSendStatus("error");
      setSendMessage("Phone number must be exactly 10 digits.");
      return;
    }
    setSendStatus("loading");
    setSendMessage("Sending your OTP...");
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        auth: "omit",
        body: JSON.stringify({ phone: sendPhone })
      });
      setSendStatus("success");
      setOtpCountdown(30);
      setSendMessage("OTP sent! Check your device or dev logs.");
    } catch (error) {
      setSendStatus("error");
      setSendMessage(getErrorMessage(error));
    }
  }

  async function handleVerifyOtp() {
    if (!phoneRegex.test(verifyPhone)) {
      setVerifyStatus("error");
      setVerifyMessage("Phone number must be exactly 10 digits.");
      return;
    }
    if (!otpRegex.test(otpCode)) {
      setVerifyStatus("error");
      setVerifyMessage("OTP must be exactly 6 digits.");
      return;
    }
    setVerifyStatus("loading");
    setVerifyMessage("Verifying OTP...");
    try {
      await apiFetch("/auth/otp/verify", {
        method: "POST",
        auth: "omit",
        body: JSON.stringify({ phone: verifyPhone, code: otpCode, rememberMe })
      });
      setVerifyStatus("success");
      setVerifyMessage("OTP verified! Redirecting...");
      const user = await refresh();
      const destination = getDefaultRoute(user);
      setTimeout(() => router.push(destination), 200);
    } catch (error) {
      setVerifyStatus("error");
      setVerifyMessage(getErrorMessage(error));
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-visual">
        <div className="auth-visual-panel">
          <div className="auth-badge">One-time access</div>
          <h1>Verify your phone in seconds.</h1>
          <p>Secure your login with a code sent directly to your device.</p>
        </div>
      </section>

      <section className="auth-card">
        <div>
          <h2>OTP Center</h2>
          <p className="card-subtitle">Send a code, then verify to continue.</p>
        </div>
        <div className="form">
          <div className="field">
          <label htmlFor="send-phone">Phone</label>
          <input
            id="send-phone"
            placeholder="10-digit phone number"
            value={sendPhone}
            onChange={(e) => setSendPhone(e.target.value)}
          />
        </div>
        <button onClick={handleSendOtp} disabled={sendStatus === "loading" || otpCountdown > 0}>
          {sendStatus === "loading"
            ? "Sending..."
            : otpCountdown > 0
              ? `Resend in ${otpCountdown}s`
              : "Send OTP"}
        </button>
        {sendMessage ? <p className={`message ${sendStatus}`}>{sendMessage}</p> : null}
      </div>
        <div className="divider" />
        <div className="form">
          <div className="field">
            <label htmlFor="verify-phone">Phone</label>
            <input
              id="verify-phone"
              placeholder="10-digit phone number"
              value={verifyPhone}
              onChange={(e) => setVerifyPhone(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="otp-code">OTP code</label>
            <OtpInput value={otpCode} onChange={setOtpCode} disabled={verifyStatus === "loading"} idPrefix="otp-code" />
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Remember me on this device
          </label>
          <button onClick={handleVerifyOtp} disabled={verifyStatus === "loading"}>
            {verifyStatus === "loading" ? "Verifying..." : "Verify OTP"}
          </button>
          {verifyMessage ? (
            <p className={`message ${verifyStatus}`}>
              {verifyMessage} {verifyStatus === "success" ? <a href="/login">Go to login</a> : null}
            </p>
          ) : null}
        </div>
        <footer className="auth-footer">Need help? Reach out to concierge support.</footer>
      </section>
    </div>
  );
}
