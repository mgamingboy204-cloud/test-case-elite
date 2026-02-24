"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { OtpInput, ResendTimer } from "@/app/components/OtpInput";
import { useToast } from "@/app/providers";
import { apiFetch, resetAuthFailureState } from "@/lib/api";
import { setAccessToken } from "@/lib/authToken";
import { getDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";
import styles from "./page.module.css";

export default function OtpPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, "");
    if (!/^\d{10}$/.test(cleaned)) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: { phone: cleaned } as never,
        auth: "omit",
      });
      setOtpSent(true);
      addToast("OTP sent!", "success");
    } catch {
      addToast("Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    try {
      const verificationResponse = await apiFetch<{ accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, ""), code, rememberMe } as never,
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
      addToast("Invalid code", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={styles.card}>
      <div className={styles.container}>
        <h2 className={styles.title}>OTP Sign In</h2>
        <p className={styles.subtitle}>
          {otpSent ? "Enter the code we sent you" : "Sign in with a one-time code"}
        </p>

        {!otpSent ? (
          <>
            <Input
              label="Phone Number"
              type="tel"
              placeholder="1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={error}
              maxLength={10}
              inputMode="numeric"
            />
            <Button
              fullWidth
              size="lg"
              loading={loading}
              onClick={handleSendOtp}
              className={styles.button}
            >
              Send Code
            </Button>
          </>
        ) : (
          <div className={styles.stack}>
            <label className={styles.checkRow}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className={styles.checkbox}
              />
              Keep me signed in on this device
            </label>
            <OtpInput onComplete={handleVerify} disabled={loading} />
            <ResendTimer onResend={handleSendOtp} />
          </div>
        )}

        <p className={styles.footer}>
          <Link href="/login" className={styles.backLink}>
            Back to Sign In
          </Link>
        </p>
      </div>
    </Card>
  );
}
