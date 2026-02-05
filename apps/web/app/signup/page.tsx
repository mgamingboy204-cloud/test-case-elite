"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../lib/api";
import { useSession } from "../../lib/session";
import { getDefaultRoute } from "../../lib/onboarding";

type Status = "idle" | "loading" | "success" | "error";

const steps = [
  { title: "Create account", description: "Start with phone, email, and password." },
  { title: "Verify OTP", description: "Confirm your phone number." }
];

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
        body: JSON.stringify({ phone: account.phone, code: otpCode })
      });
      const nextToken = response.accessToken ?? response.token;
      if (nextToken) {
        setToken(nextToken);
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
    <div className="grid two-column">
      <section className="card">
        <h2>Sign Up</h2>
        <p className="card-subtitle">Premium onboarding in two steps.</p>
        <ol className="progress">
          {steps.map((stepItem, index) => (
            <li key={stepItem.title} className={index === step ? "active" : index < step ? "done" : ""}>
              <span>{index + 1}</span>
              <div>
                <strong>{stepItem.title}</strong>
                <p>{stepItem.description}</p>
              </div>
            </li>
          ))}
        </ol>
        {message ? <p className={`message ${status}`}>{message}</p> : null}
      </section>

      {step === 0 ? (
        <section className="card">
          <h3>Create your account</h3>
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
            <button onClick={createAccount} disabled={status === "loading"}>
              {status === "loading" ? "Creating..." : "Create account"}
            </button>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="card">
          <h3>Verify OTP</h3>
          <p className="card-subtitle">We sent your code to {account.phone || "your phone"}.</p>
          <div className="form">
            <button className="secondary" onClick={resendOtp} disabled={status === "loading"}>
              Resend OTP
            </button>
            <div className="field">
              <label htmlFor="signup-otp">OTP Code</label>
              <input
                id="signup-otp"
                placeholder="6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />
            </div>
            <button onClick={verifyOtp} disabled={status === "loading"}>
              Verify OTP
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
