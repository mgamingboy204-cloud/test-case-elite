"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";
import { OtpInput, ResendTimer } from "@/app/components/OtpInput";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { setAccessToken } from "@/lib/authToken";
import { getDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";

export default function LoginPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* OTP state */
  const [otpRequired, setOtpRequired] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!/^\d{10}$/.test(phone.replace(/\D/g, "")))
      errs.phone = "Enter a valid 10-digit phone number";
    if (password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const loginResponse = await apiFetch<{ accessToken?: string; otpRequired?: boolean }>("/auth/login", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, ""), password, rememberMe, rememberDevice30Days: rememberDevice } as never,
        auth: "omit",
      });
      if (loginResponse?.otpRequired) {
        setOtpRequired(true);
        await handleSendOtp();
        return;
      }
      if (loginResponse?.accessToken) {
        setAccessToken(loginResponse.accessToken);
      }
      const user = await refresh();
      addToast("Successfully authenticated into the network.", "success");
      router.push(getDefaultRoute(user));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: { phone: phone.replace(/\D/g, "") } as never,
        auth: "omit",
      });
      addToast("A verification fragment has been dispatched.", "info");
    } catch {
      addToast("Failed to dispatch verification fragment.", "error");
    }
  };

  const handleVerifyOtp = async (code: string) => {
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
      addToast("Identity elegantly verified.", "success");
      router.push(getDefaultRoute(user));
    } catch {
      addToast("Invalid code fragment.", "error");
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
        <Card className="p-12 md:p-16 border-white/60 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.1)] backdrop-blur-3xl bg-white/40 rounded-[4rem] relative overflow-hidden group">
          <header className="text-center mb-14 space-y-4">
            <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-foreground/90 italic">The Entry</h1>
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 italic">
                Authentication Ritual
              </p>
              <div className="w-12 h-[1px] bg-primary/20" />
            </div>
          </header>

          <AnimatePresence mode="wait">
            {!otpRequired ? (
              <motion.div
                key="password-login"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-10"
              >
                <div className="space-y-8">
                  <Input
                    label="Terminal Phone Number"
                    type="tel"
                    placeholder="1234567890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={errors.phone}
                    maxLength={10}
                    inputMode="numeric"
                  />

                  <div className="relative group">
                    <Input
                      label="Security Passphrase"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={errors.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-12 text-[9px] uppercase tracking-[0.3em] font-black text-primary/30 hover:text-primary transition-all duration-500 italic"
                    >
                      {showPassword ? "Obscure" : "Reveal"}
                    </button>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                      <div className={`w-6 h-6 rounded-2xl border-2 border-primary/10 flex items-center justify-center transition-all duration-700 ${rememberMe ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-white/40 group-hover:border-primary/30"}`}>
                        {rememberMe && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in duration-500" />}
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/30 group-hover:text-primary/60 transition-colors italic">Preserve Session Identity</span>
                    </div>

                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setRememberDevice(!rememberDevice)}>
                      <div className={`w-6 h-6 rounded-2xl border-2 border-primary/10 flex items-center justify-center transition-all duration-700 ${rememberDevice ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-white/40 group-hover:border-primary/30"}`}>
                        {rememberDevice && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in duration-500" />}
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/30 group-hover:text-primary/60 transition-colors italic">Trust this Domicile (30 Days)</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    fullWidth
                    size="xl"
                    loading={loading}
                    onClick={handleLogin}
                    variant="premium"
                    className="py-8 rounded-[1.5rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black"
                  >
                    Initiate Secure Entry
                  </Button>
                </div>

                <div className="text-center space-y-8 pt-6">
                  <Link href="/otp" className="block text-[10px] uppercase tracking-[0.4em] font-black text-primary/30 hover:text-primary hover:tracking-[0.5em] transition-all duration-700 italic border-b border-primary/5 pb-1 inline-block">
                    One-Time Passcode Entry
                  </Link>
                  <p className="text-[10px] text-muted-foreground/30 font-black uppercase tracking-[0.3em] italic">
                    New to the collective?{" "}
                    <Link href="/signup" className="text-primary/60 hover:text-primary transition-colors underline decoration-primary/10 underline-offset-8">
                      Apply for Invitation
                    </Link>
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp-login"
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-12"
              >
                <div className="text-center space-y-4">
                  <p className="text-sm text-foreground/60 font-serif italic leading-relaxed px-4">
                    A unique courier code has been sent to your device. Please verify your presence to continue.
                  </p>
                </div>

                <div className="py-6 scale-110">
                  <OtpInput onComplete={handleVerifyOtp} disabled={loading} />
                </div>

                <div className="space-y-8 pt-4">
                  <ResendTimer onResend={handleSendOtp} />
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => setOtpRequired(false)}
                    className="text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/30 hover:text-foreground/60 rounded-[1.5rem] py-6 border-black/[0.03] hover:bg-white transition-all duration-700 italic"
                  >
                    Return to Passphrase
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cinematic accent blurs on card */}
          <div className="absolute -right-24 -top-24 w-48 h-48 bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-all duration-1000" />
          <div className="absolute -left-24 -bottom-24 w-48 h-48 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        </Card>

        <footer className="mt-16 text-center">
          <p className="text-[10px] text-muted-foreground/20 uppercase tracking-[0.6em] font-black italic">
            Premium End-to-End Encryption
          </p>
        </footer>
      </motion.div>
    </div>
  );
}
