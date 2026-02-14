"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { OtpInput, ResendTimer } from "@/app/components/OtpInput";
import { PremiumButton } from "@/app/components/premium/PremiumButton";
import { PremiumCard } from "@/app/components/premium/PremiumCard";
import { PremiumInput } from "@/app/components/premium/PremiumInput";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { apiEndpoints } from "@/lib/apiEndpoints";
import { setAccessToken } from "@/lib/authToken";
import { resolvePostAuthRoute } from "@/lib/authRouting";
import type { SessionUser } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [otpRequired, setOtpRequired] = useState(false);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) next.phone = "Enter a valid 10-digit phone number";
    if (password.length < 8) next.password = "Password must be at least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const loginResult = await apiFetch(apiEndpoints.authLogin, { body: { phone: phone.replace(/\D/g, ""), password } as never, auth: "omit" });
      if ("otpRequired" in loginResult && loginResult.otpRequired) {
        setOtpRequired(true);
        return;
      }
      if ("accessToken" in loginResult) setAccessToken(loginResult.accessToken);
      addToast("Signed in", "success");
      router.push(await resolvePostAuthRoute((loginResult as { user?: SessionUser }).user ?? null));
    } catch (error) {
      addToast(error instanceof Error ? error.message : "Unable to sign in", "error");
    } finally {
      setLoading(false);
    }
  };



  const handleSendOtp = async () => {
    try {
      await apiFetch(apiEndpoints.authOtpSend, { body: { phone: phone.replace(/\D/g, "") } as never, auth: "omit" });
    } catch {
      addToast("Unable to send code", "error");
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    try {
      const verifyResult = await apiFetch(apiEndpoints.authOtpVerify, { body: { phone: phone.replace(/\D/g, ""), code } as never, auth: "omit" });
      if (verifyResult.accessToken) setAccessToken(verifyResult.accessToken);
      router.push(await resolvePostAuthRoute((verifyResult as { user?: SessionUser }).user ?? null));
    } catch { addToast("Invalid code", "error"); }
    finally { setLoading(false); }
  };

  return (
    <div className="premium-page-enter" style={{ width: "min(480px, 100%)" }}>
      <PremiumCard className="auth-card">
        <h1 className="ds-title">Member sign in</h1>
        <p className="auth-card__subtitle">Access your secure membership account.</p>
        {!otpRequired ? (<>
          <div className="auth-form-fields">
            <PremiumInput label="Phone Number" type="tel" placeholder="1234567890" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} maxLength={10} inputMode="numeric" />
            <PremiumInput label="Password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
          </div>
          <PremiumButton fullWidth onClick={handleLogin} loading={loading}>Sign In</PremiumButton>
          <p className="auth-note">Your details stay confidential. Verification protects members.</p>
          <div className="auth-links auth-links--single">
            <p>Need code access? <Link href="/otp">Use one-time code</Link></p>
          </div>
        </>) : (
          <div className="auth-otp-wrap">
            <p>Enter the 6-digit code sent to your phone.</p>
            <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
            <ResendTimer onResend={handleSendOtp} />
          </div>
        )}
      </PremiumCard>
    </div>
  );
}
