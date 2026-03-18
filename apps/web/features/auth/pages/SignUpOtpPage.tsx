"use client";

import { useEffect, useState } from "react";
import { allowTestBypass, useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { OtpVerificationCard } from "@/features/auth/components/OtpVerificationCard";
import { useOtpCountdown } from "@/features/auth/hooks/useOtpCountdown";

export default function SignUpOtpPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { countdown, resetCountdown } = useOtpCountdown();
  const { pendingPhone, verifySignupOtp, verifySignupOtpMock, resendSignupOtp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!pendingPhone) {
      router.replace("/signup/phone");
    }
  }, [pendingPhone, router]);

  const handleComplete = async (otp: string) => {
    setLoading(true);
    setError("");
    try {
      await verifySignupOtp(otp);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Invalid verification code.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendSignupOtp();
      resetCountdown();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to resend code");
    }
  };

  return (
    <OtpVerificationCard
      stepLabel="STEP 02"
      title={<>Verify <span className="font-semibold text-primary">Device</span></>}
      description={<>We need to ensure you own this device. Enter the code sent to +91 {pendingPhone}.</>}
      error={error}
      loading={loading}
      countdown={countdown}
      onComplete={(otp) => void handleComplete(otp)}
      onResend={() => void handleResend()}
      mockAction={allowTestBypass ? () => void verifySignupOtpMock().catch((err) => setError(err instanceof Error ? err.message : "Mock OTP failed")) : undefined}
    />
  );
}
