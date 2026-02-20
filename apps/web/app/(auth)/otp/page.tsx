"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { OtpInput, ResendTimer } from "@/app/components/OtpInput";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { setAccessToken } from "@/lib/authToken";
import { getDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";

export default function OtpPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

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
      addToast("A digital fragment has been dispatched.", "success");
    } catch {
      addToast("The dispatch ritual failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    try {
      const verificationResponse = await apiFetch<{ accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, ""), code, rememberMe } as never,
        auth: "omit",
      });
      if (verificationResponse?.accessToken) {
        setAccessToken(verificationResponse.accessToken);
      }
      const user = await refresh();
      addToast("Identity synchronized elegantly.", "success");
      router.push(getDefaultRoute(user));
    } catch {
      addToast("The code appears to be out of sync.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[480px] relative z-10"
      >
        <Card className="p-12 md:p-16 bg-white/40 backdrop-blur-3xl border-white/60 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.1)] rounded-[4rem] overflow-hidden group">
          <header className="mb-14 space-y-4 text-center">
            <h1 className="text-5xl md:text-6xl font-serif text-foreground/90 italic tracking-tight">The Ritual</h1>
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 italic">
                Secure Synchronization
              </p>
              <div className="w-12 h-[1px] bg-primary/20" />
            </div>
            <p className="text-[11px] text-muted-foreground/40 leading-relaxed italic pt-4 px-4">
              {otpSent
                ? "Enter the six-digit fragment transmitted to your terminal identifier."
                : "Access the collective via a fleeting temporal secure code."}
            </p>
          </header>

          <AnimatePresence mode="wait">
            {!otpSent ? (
              <motion.div
                key="phone-input"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
                <Input
                  label="Terminal Identifier"
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
                  size="xl"
                  loading={loading}
                  onClick={handleSendOtp}
                  variant="premium"
                  className="py-8 rounded-[1.5rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black"
                >
                  Dispatch Signal
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="otp-input"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-12"
              >
                <div className="space-y-8">
                  <div className="flex items-center gap-4 group cursor-pointer px-1" onClick={() => setRememberMe(!rememberMe)}>
                    <div className={`w-6 h-6 rounded-2xl border-2 border-primary/10 flex items-center justify-center transition-all duration-700 ${rememberMe ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-white/40 group-hover:border-primary/30"}`}>
                      {rememberMe && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in duration-500" />}
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/30 group-hover:text-primary/60 transition-colors italic">Memorialize my presence</span>
                  </div>

                  <div className="py-6 scale-110">
                    <OtpInput onComplete={handleVerify} disabled={loading} />
                  </div>

                  <div className="pt-4 border-t border-primary/5">
                    <ResendTimer onResend={handleSendOtp} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <footer className="mt-14 pt-10 border-t border-primary/5 text-center">
            <Link
              href="/login"
              className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/30 hover:text-primary transition-all duration-700 italic border-b border-primary/5 pb-1 inline-block"
            >
              ← Return to Origin
            </Link>
          </footer>

          {/* Cinematic accent blurs on card */}
          <div className="absolute -right-24 -top-24 w-48 h-48 bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-all duration-1000" />
          <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        </Card>

        <p className="mt-16 text-center text-[10px] uppercase tracking-[0.6em] font-black text-muted-foreground/20 italic">
          All signals are end-to-end encrypted
        </p>
      </motion.div>
    </div>
  );
}
