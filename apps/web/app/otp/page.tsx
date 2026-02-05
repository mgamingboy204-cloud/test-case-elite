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

export default function OtpPage() {
  const router = useRouter();
  const [sendPhone, setSendPhone] = useState("");
  const [sendStatus, setSendStatus] = useState<Status>("idle");
  const [sendMessage, setSendMessage] = useState("");

  const [verifyPhone, setVerifyPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<Status>("idle");
  const [verifyMessage, setVerifyMessage] = useState("");
  const { refresh, setToken } = useSession();

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
      const response = await apiFetch<{ token?: string; accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        auth: "omit",
        body: JSON.stringify({ phone: verifyPhone, code: otpCode })
      });
      const nextToken = response.accessToken ?? response.token;
      if (nextToken) {
        setToken(nextToken);
      }
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
    <div className="grid">
      <section className="card">
        <div>
          <h2>Send OTP</h2>
          <p className="card-subtitle">Request a one-time password to verify your phone.</p>
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
          <button onClick={handleSendOtp} disabled={sendStatus === "loading"}>
            {sendStatus === "loading" ? "Sending..." : "Send OTP"}
          </button>
          {sendMessage ? <p className={`message ${sendStatus}`}>{sendMessage}</p> : null}
        </div>
      </section>

      <section className="card">
        <div>
          <h2>Verify OTP</h2>
          <p className="card-subtitle">Enter the code sent to your phone.</p>
        </div>
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
            <input
              id="otp-code"
              placeholder="6-digit code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
            />
          </div>
          <button onClick={handleVerifyOtp} disabled={verifyStatus === "loading"}>
            {verifyStatus === "loading" ? "Verifying..." : "Verify OTP"}
          </button>
          {verifyMessage ? (
            <p className={`message ${verifyStatus}`}>
              {verifyMessage}{" "}
              {verifyStatus === "success" ? <a href="/login">Go to login</a> : null}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
