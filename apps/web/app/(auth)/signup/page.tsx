"use client";

import React, { useMemo, useState } from "react";
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

type Stage = "IDENTITY" | "SECURITY" | "VERIFICATION";

const stageVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 40 : -40,
    opacity: 0,
    scale: 0.98,
    filter: "blur(15px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 1,
      ease: [0.16, 1, 0.3, 1] as any,
    }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 40 : -40,
    opacity: 0,
    scale: 1.02,
    filter: "blur(15px)",
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as any,
    }
  })
};

export default function SignupPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();

  const [[stage, direction], setStage] = useState<[Stage, number]>(["IDENTITY", 0]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Concierge Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const cleanedPhone = useMemo(() => phone.replace(/\D/g, ""), [phone]);

  const paginate = (newStage: Stage, newDirection: number) => {
    setStage([newStage, newDirection]);
  };

  const validateIdentity = () => {
    if (!name.trim()) {
      setErrors({ name: "A name is required for our records." });
      return false;
    }
    if (cleanedPhone.length !== 10) {
      setErrors({ phone: "Our network requires a valid 10-digit number." });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSecurityInitialize = () => {
    const nextErrors: Record<string, string> = {};
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Please use a valid elite email address.";
    }
    if (password.length < 8) {
      nextErrors.password = "A stronger security key (min 8 chars) is required.";
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Security keys must match perfectly.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    handleRegister();
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: { name, phone: cleanedPhone, email, password } as never,
        auth: "omit"
      });
      addToast("Your identity has been queued. Verification dispatched.", "success");
      paginate("VERIFICATION", 1);
    } catch (err: any) {
      addToast(err.message || "We could not process your application at this time.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone: cleanedPhone, code, rememberMe } as never,
        auth: "omit"
      });
      if (res?.accessToken) setAccessToken(res.accessToken);
      const user = await refresh();
      addToast("Identity Confirmed. Welcome to the Elite network.", "success");
      router.push(getDefaultRoute(user));
    } catch (err: any) {
      addToast(err.message || "Invalid access code.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: { phone: cleanedPhone } as never,
        auth: "omit"
      });
      addToast("A new access code has been dispatched.", "info");
    } catch {
      addToast("Dispatch failure. Please try again later.", "error");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[540px] relative z-10"
      >
        <Card className="p-0 overflow-hidden border-white/60 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.1)] backdrop-blur-3xl bg-white/40 rounded-[4rem] group border border-white/60">
          {/* Progress Indication */}
          <div className="relative h-1.5 w-full bg-primary/5">
            <motion.div
              animate={{ width: stage === "IDENTITY" ? "33.3%" : stage === "SECURITY" ? "66.6%" : "100%" }}
              transition={{ type: "spring", stiffness: 40, damping: 20 }}
              className="h-full bg-primary/40 shadow-[0_0_20px_rgba(232,165,178,0.4)]"
            />
          </div>

          <div className="p-12 md:p-16">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={stage}
                custom={direction}
                variants={stageVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {stage === "IDENTITY" && (
                  <div className="space-y-12">
                    <header className="text-center space-y-4">
                      <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-foreground/90 italic">The Discovery</h1>
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 italic">
                          Phase 1: Your Identity
                        </p>
                        <div className="w-12 h-[1px] bg-primary/20" />
                      </div>
                    </header>

                    <div className="space-y-8">
                      <Input
                        label="Nom de Plume (Legal Name)"
                        placeholder="e.g. Julian Sterling"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={errors.name}
                      />
                      <Input
                        label="Encrypted Line (Phone)"
                        type="tel"
                        placeholder="123 456 7890"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        error={errors.phone}
                        maxLength={10}
                        inputMode="numeric"
                      />
                    </div>

                    <div className="pt-6">
                      <Button
                        variant="premium"
                        size="xl"
                        fullWidth
                        onClick={() => { if (validateIdentity()) paginate("SECURITY", 1); }}
                        className="py-8 rounded-[1.5rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black"
                      >
                        Authenticate to Next Phase
                      </Button>
                    </div>
                  </div>
                )}

                {stage === "SECURITY" && (
                  <div className="space-y-12">
                    <header className="text-center space-y-4">
                      <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-foreground/90 italic">Access Control</h1>
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 italic">
                          Phase 2: Security Credentials
                        </p>
                        <div className="w-12 h-[1px] bg-primary/20" />
                      </div>
                    </header>

                    <div className="space-y-8">
                      <Input
                        label="Private Correspondence (Email)"
                        type="email"
                        placeholder="vault@elite.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        error={errors.email}
                      />
                      <Input
                        label="Master Passphrase"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={errors.password}
                      />
                      <Input
                        label="Re-verify Passphrase"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={errors.confirmPassword}
                      />
                    </div>

                    <div className="space-y-6 pt-6">
                      <Button
                        variant="premium"
                        size="xl"
                        fullWidth
                        loading={loading}
                        onClick={handleSecurityInitialize}
                        className="py-8 rounded-[1.5rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black"
                      >
                        Request Vault Entry
                      </Button>
                      <button
                        onClick={() => paginate("IDENTITY", -1)}
                        className="w-full text-muted-foreground/30 text-[10px] uppercase tracking-[0.4em] font-black hover:text-primary transition-all duration-700 italic"
                      >
                        Return to Discovery
                      </button>
                    </div>
                  </div>
                )}

                {stage === "VERIFICATION" && (
                  <div className="space-y-12 text-center">
                    <header className="space-y-6">
                      <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-foreground/90 italic">The Cipher</h1>
                      <div className="space-y-2">
                        <p className="text-sm text-foreground/60 font-serif italic leading-relaxed">
                          A unique verification code has been dispatched to
                        </p>
                        <p className="text-2xl text-primary/60 font-serif italic">{phone}</p>
                      </div>
                    </header>

                    <div className="flex flex-col items-center gap-10 py-4">
                      <div className="scale-110">
                        <OtpInput onComplete={handleVerify} disabled={loading} />
                      </div>
                      <ResendTimer onResend={handleResend} />
                    </div>

                    <div className="space-y-10 pt-4">
                      <div
                        className="flex items-center justify-center gap-4 cursor-pointer group"
                        onClick={() => setRememberMe(!rememberMe)}
                      >
                        <div className={`w-6 h-6 rounded-2xl border-2 border-primary/10 flex items-center justify-center transition-all duration-700 ${rememberMe ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-white/40 group-hover:border-primary/30"}`}>
                          {rememberMe && <div className="w-2 h-2 rounded-full bg-white animate-in zoom-in duration-500" />}
                        </div>
                        <span className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/30 group-hover:text-primary/60 transition-colors italic">Trust this terminal (30 Days)</span>
                      </div>

                      <button
                        onClick={() => paginate("SECURITY", -1)}
                        className="text-muted-foreground/30 text-[10px] uppercase tracking-[0.4em] font-black hover:text-primary transition-all duration-700 italic border-b border-primary/5 pb-1 inline-block"
                      >
                        Refine Application Details
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Cinematic accent blurs on card */}
          <div className="absolute -right-32 -top-32 w-64 h-64 bg-primary/10 rounded-full blur-[120px] pointer-events-none group-hover:bg-primary/20 transition-all duration-1000" />
          <div className="absolute -left-32 -bottom-32 w-64 h-64 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        </Card>

        <footer className="mt-16 text-center space-y-6">
          <p className="text-[10px] text-muted-foreground/20 uppercase tracking-[0.5em] font-black italic">
            Already part of the inner circle?
          </p>
          <Link
            href="/login"
            className="inline-block text-primary/60 hover:text-primary transition-all duration-700 font-serif italic text-2xl border-b border-primary/10 hover:border-primary/40 pb-2"
          >
            Authenticate into your workspace
          </Link>
        </footer>
      </motion.div>
    </div>
  );
}
