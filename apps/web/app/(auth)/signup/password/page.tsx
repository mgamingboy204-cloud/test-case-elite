"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function SignUpPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { pendingPhone, signupToken, completeSignup } = useAuth();
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!pendingPhone || !signupToken) {
      router.replace('/signup/phone');
    }
  }, [pendingPhone, signupToken, router]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword || password.length < 8) return;
    
    setLoading(true);
    setError("");
    try {
      await completeSignup(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete signup.");
      setLoading(false);
    }
  };

  const isMatch = password === confirmPassword && password.length > 0;
  const isLengthValid = password.length >= 8;

  return (
    <GlassCard>
      <div className="mb-8">
        <span className="text-xs font-mono tracking-widest text-primary/80 mb-2 block">STEP 03</span>
        <h1 className="text-3xl font-light mb-2 text-foreground">Secure <span className="font-semibold text-primary">Access</span></h1>
        <p className="text-foreground/60 font-light leading-relaxed">
          Create a strong password to protect your exclusive profile and data.
        </p>
      </div>

      <form onSubmit={handleContinue} className="flex flex-col gap-5">
        <Input 
          type="password" 
          label="New Password" 
          placeholder="Min. 8 characters" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={password.length > 0 && !isLengthValid ? "Password must be at least 8 characters" : undefined}
        />
        
        <Input 
          type="password" 
          label="Confirm Password" 
          placeholder="Repeat password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={confirmPassword.length > 0 && !isMatch ? "Passwords do not match" : undefined}
        />

        <Button 
          type="submit" 
          disabled={!isMatch || !isLengthValid || loading}
          className="w-full mt-4"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
          ) : (
            "Complete Account Setup"
          )}
        </Button>
      </form>
    </GlassCard>
  );
}
