"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardEvent, KeyboardEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/app/providers";
import { apiFetch, resetAuthFailureState } from "@/lib/api";
import { setAccessToken } from "@/lib/authToken";
import { getDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";
import styles from "./verify.module.css";

const PHONE_STORAGE_KEY = "em_signup_phone";
const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

export default function AppSignupVerifyPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();

  const [otpDigits, setOtpDigits] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const [cleanedPhone, setCleanedPhone] = useState("");
  const otpValue = otpDigits.join("");

  const maskedPhone = useMemo(() => {
    if (!cleanedPhone) return "your number";
    const last2 = cleanedPhone.slice(-2);
    return `+91 ${"•".repeat(Math.max(0, cleanedPhone.length - 2))}${last2}`;
  }, [cleanedPhone]);

  useLayoutEffect(() => {
    document.body.classList.add("app-entry-no-scroll");

    return () => {
      document.body.classList.remove("app-entry-no-scroll");
    };
  }, []);

  useEffect(() => {
    setCleanedPhone((sessionStorage.getItem(PHONE_STORAGE_KEY) ?? "").replace(/\D/g, ""));
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (!cleanedPhone) {
      router.replace("/app/signup/phone");
      return;
    }

    sessionStorage.setItem(PHONE_STORAGE_KEY, cleanedPhone);
  }, [cleanedPhone, router]);

  useEffect(() => {
    if (resendIn <= 0) return;

    const timer = window.setInterval(() => {
      setResendIn((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendIn]);

  const updateDigit = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, "");
    if (!nextValue && value) return;

    setError("");
    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = nextValue.slice(-1);
      return next;
    });

    if (nextValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const next = Array.from({ length: OTP_LENGTH }, (_, index) => pasted[index] ?? "");
    setOtpDigits(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleResend = async () => {
    if (resendIn > 0 || !cleanedPhone) return;

    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: { phone: cleanedPhone } as never,
        auth: "omit"
      });
      setResendIn(RESEND_SECONDS);
      addToast("Code resent", "info");
    } catch {
      addToast("Could not resend code", "error");
    }
  };

  const handleVerify = async () => {
    if (otpValue.length !== OTP_LENGTH || !cleanedPhone || loading) return;

    setLoading(true);
    setError("");

    try {
      const verificationResponse = await apiFetch<{ accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone: cleanedPhone, code: otpValue, rememberMe: true } as never,
        auth: "omit"
      });

      if (verificationResponse?.accessToken) {
        resetAuthFailureState();
        setAccessToken(verificationResponse.accessToken);
      }

      const user = await refresh();
      addToast("Phone verified!", "success");
      router.replace(getDefaultRoute(user));
    } catch {
      setError("Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={`${styles.screen} entry-screen`} aria-label="OTP verification">
      <div className={styles.chrome}>
        <Link href="/app/signup/phone" className={styles.backButton} aria-label="Go back">
          ←
        </Link>
        <span />
        <Link href="/app/signup/phone" className={styles.changeLink}>Change number</Link>
      </div>

      <section className={styles.content}>
        <h1 className={styles.title}>Enter code</h1>
        <p className={styles.subtitle}>Sent to {maskedPhone}</p>

        <div className={styles.otpRow}>
          {otpDigits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              value={digit}
              onChange={(event) => updateDigit(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              className={styles.otpInput}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label={`OTP digit ${index + 1}`}
              maxLength={1}
            />
          ))}
        </div>

        <p className={styles.errorText} role="status" aria-live="polite">
          {error}
        </p>
      </section>

      <section className={styles.bottom}>
        <button
          type="button"
          className={styles.primaryButton}
          disabled={otpValue.length !== OTP_LENGTH || loading}
          onClick={handleVerify}
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        <div className={styles.resendRow}>
          <button type="button" className={styles.resendButton} disabled={resendIn > 0} onClick={handleResend}>
            Resend code
          </button>
          <span className={styles.countdown}>{resendIn > 0 ? `in ${resendIn}s` : "now"}</span>
        </div>

        <p className={styles.hint}>Didn&apos;t get a code?</p>
      </section>
    </main>
  );
}
