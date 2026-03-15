"use client";

import { useState } from "react";
import { PhoneInput } from "@/components/auth/phone-input";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function SignUpPhone() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { startSignup } = useAuth();

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 10) return;
    
    setLoading(true);
    setError("");
    try {
      await startSignup(phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <div className="mb-8">
        <span className="text-xs font-mono tracking-widest text-primary/80 mb-2 block">STEP 01</span>
        <h1 className="text-3xl font-light mb-2 text-foreground">Apply for <span className="font-semibold text-primary">Elite</span></h1>
        <p className="text-foreground/60 font-light leading-relaxed">
          Membership is strictly invitation-only. Begin by entering your mobile number to verify your status.
        </p>
      </div>

      <form onSubmit={handleContinue} className="flex flex-col gap-6">
        <PhoneInput value={phone} onChange={setPhone} />

        {error ? <p className="text-sm text-red-400 text-center">{error}</p> : null}
        
        <p className="text-xs text-foreground/40 leading-relaxed text-center px-4">
          By proceeding, you agree to our <Link href="/terms" className="underline hover:text-primary">Terms of Service</Link> & <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
        </p>

        <Button 
          type="submit" 
          disabled={phone.length !== 10 || loading}
          className="w-full"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
          ) : (
            "Continue"
          )}
        </Button>
      </form>

      <div className="mt-8 pt-6 border-t border-border/50 text-center">
        <p className="text-sm text-foreground/50">
          Already verified? <Link href="/signin" className="text-primary hover:underline">Sign In</Link>
        </p>
      </div>
    </GlassCard>
  );
}
