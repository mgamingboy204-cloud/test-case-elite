"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { OtpInput, ResendTimer } from "@/app/components/OtpInput";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { setAccessToken } from "@/lib/authToken";

export default function OtpPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const verifyResult = await apiFetch<{ ok: boolean; accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, ""), code } as never,
        auth: "omit",
      });
      if (verifyResult.accessToken) {
        setAccessToken(verifyResult.accessToken);
      }
      addToast("Verified!", "success");
      router.push("/discover");
    } catch {
      addToast("Invalid code", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={{ maxWidth: 420, width: "100%", padding: 0 }}>
      <div style={{ padding: "32px 28px" }}>
        <h2 style={{ marginBottom: 4 }}>OTP Sign In</h2>
        <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 24 }}>
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
              style={{ marginTop: 20 }}
            >
              Send Code
            </Button>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <OtpInput onComplete={handleVerify} disabled={loading} />
            <ResendTimer onResend={handleSendOtp} />
          </div>
        )}

        <p
          style={{
            fontSize: 14,
            color: "var(--muted)",
            textAlign: "center",
            marginTop: 24,
          }}
        >
          <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
            Back to Sign In
          </Link>
        </p>
      </div>
    </Card>
  );
}
