"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { OTPInput } from "@/components/auth/otp-input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function SignInOTP() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(30);
  const { pendingPhone, verifySigninOtp } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!pendingPhone) {
      router.replace('/signin');
    }
  }, [pendingPhone, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

  return (
    <GlassCard>
      <h1 className="text-3xl font-light mb-2 text-foreground">Verify <span className="font-semibold text-primary">Identity</span></h1>
      <p className="text-foreground/60 mb-8 font-light leading-relaxed">
        We've sent a secure code to +91 {pendingPhone}. Please enter it below.
      </p>

      <div className="flex flex-col gap-6">
        <OTPInput length={6} onComplete={handleComplete} />
        
        {error && (
          <p className="text-sm text-red-400 text-center animate-in fade-in">{error}</p>
        )}

        <div className="flex flex-col items-center gap-4 mt-6 border-t border-border/50 pt-6">
          {loading && (
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-2" />
          )}

          <p className="text-sm text-foreground/50">
            Didn't receive a code?{" "}
            {countdown > 0 ? (
              <span className="text-foreground/80">Wait {countdown}s</span>
            ) : (
              <button 
                onClick={() => setCountdown(30)}
                className="text-primary hover:underline"
              >
                Resend SMS
              </button>
            )}
          </p>
          
          <button 
            onClick={() => router.back()}
            className="text-xs text-foreground/40 hover:text-foreground/80 transition-colors"
          >
            Use a different number
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
