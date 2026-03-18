"use client";

import { useEffect, useState } from "react";
import { allowTestBypass, useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { OtpVerificationCard } from "@/features/auth/components/OtpVerificationCard";
import { useOtpCountdown } from "@/features/auth/hooks/useOtpCountdown";

export default function SignInOtpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { countdown, resetCountdown } = useOtpCountdown();
  const { pendingPhone, verifySigninOtp, verifySigninOtpMock, resendSigninOtp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!pendingPhone) {
      router.replace("/signin");
    }
  }, [pendingPhone, router]);

  const handleComplete = async (otp: string) => {
    setLoading(true);
    setError("");

    try {
      await verifySigninOtp(otp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendSigninOtp();
      resetCountdown();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend code");
    }
  };

  return (
    <OtpVerificationCard
      title={<>Verify <span className="font-semibold text-primary">Identity</span></>}
      description={<>We’ve sent a secure code to +91 {pendingPhone}. Please enter it below.</>}
      error={error}
      loading={loading}
      countdown={countdown}
      onComplete={(otp) => void handleComplete(otp)}
      onResend={() => void handleResend()}
      mockAction={allowTestBypass ? () => void verifySigninOtpMock().catch((err) => setError(err instanceof Error ? err.message : "Mock OTP failed")) : undefined}
      footerAction={
        <button type="button" onClick={() => router.back()} className="text-xs text-foreground/40 hover:text-foreground/80 transition-colors">
          Use a different number
        </button>
      }
    />
  );
}
