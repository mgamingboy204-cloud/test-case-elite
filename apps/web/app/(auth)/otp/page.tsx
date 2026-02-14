"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PremiumCard } from "@/app/components/premium/PremiumCard";
import { PremiumInput } from "@/app/components/premium/PremiumInput";
import { PremiumButton } from "@/app/components/premium/PremiumButton";
import { OtpInput, ResendTimer } from "@/app/components/OtpInput";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { apiEndpoints } from "@/lib/apiEndpoints";
import { setAccessToken } from "@/lib/authToken";
import { resolvePostAuthRoute } from "@/lib/authRouting";
import type { SessionUser } from "@/lib/session";

export default function OtpPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    const cleaned = phone.replace(/\D/g, "");
    if (!/^\d{10}$/.test(cleaned)) return setError("Enter a valid 10-digit phone number");
    setError("");
    setLoading(true);
    try {
      await apiFetch(apiEndpoints.authOtpSend, { body: { phone: cleaned } as never, auth: "omit" });
      setOtpSent(true);
      addToast("Code sent", "success");
    } catch {
      addToast("Unable to send code", "error");
    } finally { setLoading(false); }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    try {
      const verifyResult = await apiFetch(apiEndpoints.authOtpVerify, { body: { phone: phone.replace(/\D/g, ""), code } as never, auth: "omit" });
      const authToken = verifyResult.accessToken ?? verifyResult.token ?? null;
      setAccessToken(authToken);
      router.push(await resolvePostAuthRoute((verifyResult as { user?: SessionUser }).user ?? null));
    } catch {
      addToast("Invalid code", "error");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ width: "min(480px,100%)" }}>
      <PremiumCard className="auth-card">
        <h1 className="ds-title">One-time code access</h1>
        <p className="auth-card__subtitle">{otpSent ? "Enter the code we sent" : "Use secure code verification"}</p>
        {!otpSent ? (
          <>
            <PremiumInput label="Phone Number" type="tel" placeholder="1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} error={error} maxLength={10} inputMode="numeric" />
            <div style={{ marginTop: 20 }}><PremiumButton fullWidth onClick={handleSendOtp} loading={loading}>Send code</PremiumButton></div>
          </>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <OtpInput onComplete={handleVerify} disabled={loading} />
            <ResendTimer onResend={handleSendOtp} />
          </div>
        )}
        <p className="auth-note">Your details stay confidential. Verification protects members.</p>
        <p style={{ marginTop: 12, textAlign: "center" }}><Link href="/login">Back to sign in</Link></p>
      </PremiumCard>
    </div>
  );
}
