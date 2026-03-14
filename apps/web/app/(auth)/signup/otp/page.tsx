"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/glass-card";
import { OTPInput } from "@/components/auth/otp-input";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function SignUpOTP() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, verifyOTP } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user?.phone) {
      router.replace('/auth/signup/phone');
    }
  }, [user, router]);

  const handleComplete = async (otp: string) => {
    setLoading(true);
    setError("");
    
    setTimeout(() => {
      const isValid = verifyOTP(otp);
      if (!isValid) {
        setError("Invalid verification code. Use 123456.");
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <GlassCard>
      <div className="mb-8">
        <span className="text-xs font-mono tracking-widest text-primary/80 mb-2 block">STEP 02</span>
        <h1 className="text-3xl font-light mb-2 text-foreground">Verify <span className="font-semibold text-primary">Device</span></h1>
        <p className="text-foreground/60 font-light leading-relaxed">
          We need to ensure you own this device. Enter the code sent to +91 {user?.phone}.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <OTPInput length={6} onComplete={handleComplete} />
        
        {error && (
          <p className="text-sm text-red-400 text-center animate-in fade-in">{error}</p>
        )}

        <div className="flex flex-col items-center mt-4">
          {loading && (
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          )}
        </div>
      </div>
    </GlassCard>
  );
}
