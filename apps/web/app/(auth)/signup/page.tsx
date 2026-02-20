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
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    filter: "blur(10px)",
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.6,
      ease: [0.32, 0.72, 0, 1],
    }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    filter: "blur(10px)",
    transition: {
      duration: 0.4,
      ease: "easeInOut",
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
    <div className="w-full max-w-[540px] mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
      >
        <Card className="glass-card !p-0 overflow-hidden border-white/10 shadow-[0_64px_128px_-24px_rgba(0,0,0,0.8)]">
          {/* Spring-Driven Progress Loader */}
          <div className="relative h-1.5 w-full bg-white/5">
             <motion.div 
               animate={{ width: stage === "IDENTITY" ? "33.3%" : stage === "SECURITY" ? "66.6%" : "100%" }}
               transition={{ type: "spring", stiffness: 60, damping: 20 }}
               className="h-full premium-gradient shadow-[0_0_20px_rgba(212,175,55,0.6)]"
             />
          </div>

          <div className="p-12 md:p-16">
            <AnimatePresence mode="wait" custom={direction}>
              {stage === "IDENTITY" && (
                <motion.div
                  key="identity"
                  custom={direction}
                  variants={stageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-10"
                >
                  <header className="text-center space-y-3">
                    <motion.h1 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-4xl md:text-5xl font-serif premium-text-gradient tracking-tight"
                    >
                      Discovery
                    </motion.h1>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-muted-foreground font-light tracking-wide uppercase text-[10px]"
                    >
                      Phase 1: Verify your existence
                    </motion.p>
                  </header>

                  <div className="space-y-6">
                    <Input
                      label="Legal Name"
                      placeholder="Alexander Pierce"
                      className="h-16 rounded-[1.25rem]"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      error={errors.name}
                    />
                    <Input
                      label="Secure Line (Phone)"
                      type="tel"
                      placeholder="123 456 7890"
                      className="h-16 rounded-[1.25rem]"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      error={errors.phone}
                      maxLength={10}
                    />
                  </div>

                  <Button 
                    variant="premium"
                    size="xl"
                    fullWidth
                    onClick={() => { if (validateIdentity()) paginate("SECURITY", 1); }}
                  >
                    Continue to Security
                  </Button>
                </motion.div>
              )}

              {stage === "SECURITY" && (
                <motion.div
                  key="security"
                  custom={direction}
                  variants={stageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-8"
                >
                  <header className="text-center space-y-3">
                    <h1 className="text-4xl md:text-5xl font-serif premium-text-gradient tracking-tight">Access</h1>
                    <p className="text-muted-foreground font-light tracking-wide uppercase text-[10px]">
                      Phase 2: Secure your credentials
                    </p>
                  </header>

                  <div className="space-y-5">
                    <Input
                      label="Private Email (Encrypted)"
                      type="email"
                      placeholder="vault@elite.com"
                      className="h-16 rounded-[1.25rem]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={errors.email}
                    />
                    <Input
                      label="Pass-Key"
                      type="password"
                      placeholder="••••••••"
                      className="h-16 rounded-[1.25rem]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={errors.password}
                    />
                    <Input
                      label="Confirm Pass-Key"
                      type="password"
                      placeholder="••••••••"
                      className="h-16 rounded-[1.25rem]"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={errors.confirmPassword}
                    />
                  </div>

                  <div className="pt-4 space-y-4">
                    <Button 
                      variant="premium"
                      size="xl"
                      fullWidth
                      loading={loading}
                      onClick={handleSecurityInitialize}
                    >
                      Request Final Entry
                    </Button>
                    <button 
                      onClick={() => paginate("IDENTITY", -1)}
                      className="w-full text-muted-foreground text-xs uppercase tracking-widest hover:text-primary transition-colors font-medium"
                    >
                      Back to Identity
                    </button>
                  </div>
                </motion.div>
              )}

              {stage === "VERIFICATION" && (
                <motion.div
                  key="verification"
                  custom={direction}
                  variants={stageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-12 text-center"
                >
                  <header className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-serif premium-text-gradient tracking-tight">The Key</h1>
                    <p className="text-muted-foreground font-light leading-relaxed">
                      A unique decryption code has been sent to <br/>
                      <span className="text-primary font-bold tracking-widest">{phone}</span>
                    </p>
                  </header>

                  <div className="flex flex-col items-center gap-10">
                    <OtpInput onComplete={handleVerify} disabled={loading} />
                    <ResendTimer onResend={handleResend} />
                  </div>

                  <div className="pt-6 space-y-8">
                    <label className="flex items-center justify-center gap-4 cursor-pointer group">
                      <div 
                        className={clsx(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-500",
                          rememberMe ? "bg-primary border-primary shadow-[0_0_15px_rgba(212,175,55,0.4)]" : "bg-white/5 border-white/10"
                        )}
                        onClick={() => setRememberMe(!rememberMe)}
                      >
                        {rememberMe && <span className="text-background font-bold text-xs">✔</span>}
                      </div>
                      <span className="text-sm text-muted-foreground/80 group-hover:text-foreground transition-colors font-light tracking-wide">Trust this terminal for 30 days</span>
                    </label>
                    
                    <button 
                      onClick={() => paginate("SECURITY", -1)}
                      className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] hover:text-primary transition-colors font-bold"
                    >
                      Edit Application Details
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        <footer className="mt-16 text-center space-y-2">
          <p className="text-muted-foreground/30 text-xs font-light tracking-widest uppercase">
            Already part of the network?
          </p>
          <Link 
            href="/login" 
            className="block text-primary/60 hover:text-primary transition-all duration-500 font-serif italic text-lg"
          >
            Authenticate into your vault
          </Link>
        </footer>
      </motion.div>
    </div>
  );
}
