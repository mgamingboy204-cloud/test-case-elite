"use client";

import type { ReactNode } from "react";
import { OTPInput } from "@/components/auth/otp-input";
import { GlassCard } from "@/components/ui/glass-card";


type OtpVerificationCardProps = {
  title: ReactNode;
  description: ReactNode;
  error: string;
  loading: boolean;
  countdown: number;
  onComplete: (otp: string) => void;
  onResend: () => void;
  mockAction?: () => void;
  footerAction?: ReactNode;
  stepLabel?: string;
};

export function OtpVerificationCard({
  title,
  description,
  error,
  loading,
  countdown,
  onComplete,
  onResend,
  mockAction,
  footerAction,
  stepLabel
}: OtpVerificationCardProps) {
  return (
    <GlassCard>
      <div className="mb-8">
        {stepLabel ? <span className="mb-2 block text-xs font-mono tracking-widest text-primary/80">{stepLabel}</span> : null}
        <h1 className="text-3xl font-light text-foreground">{title}</h1>
        <p className="mt-2 text-foreground/60 font-light leading-relaxed">{description}</p>
      </div>

      <div className="flex flex-col gap-6">
        <OTPInput length={6} onComplete={onComplete} />

        {error ? <p className="animate-in fade-in text-center text-sm text-red-400">{error}</p> : null}

        <div className="mt-4 flex flex-col items-center gap-3 border-t border-border/50 pt-6">
          {loading ? <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" /> : null}

          <p className="text-sm text-foreground/50">
            Didn’t receive a code?{" "}
            {countdown > 0 ? (
              <span className="text-foreground/80">Wait {countdown}s</span>
            ) : (
              <button type="button" onClick={onResend} className="text-primary hover:underline">
                Resend SMS
              </button>
            )}
          </p>

          {mockAction ? (
            <button type="button" onClick={mockAction} className="text-xs uppercase tracking-[0.2em] text-amber-300 hover:text-amber-200">
              Proceed with Mock OTP
            </button>
          ) : null}

          {footerAction}
        </div>
      </div>
    </GlassCard>
  );
}
