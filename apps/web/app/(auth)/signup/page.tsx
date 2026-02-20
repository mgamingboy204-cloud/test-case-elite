"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { OtpInput, ResendTimer } from "@/app/components/OtpInput";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { setAccessToken } from "@/lib/authToken";
import { getDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";
import { motion, AnimatePresence } from "framer-motion";

type Step = "phone" | "account" | "otp";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
    scale: 0.98
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction < 0 ? 100 : -100,
    opacity: 0,
    scale: 0.98
  })
};

export default function SignupPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();
  
  const [[step, direction], setStep] = useState<[Step, number]>(["phone", 0]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form Data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const cleanedPhone = useMemo(() => phone.replace(/\D/g, ""), [phone]);

  const paginate = (newStep: Step, newDirection: number) => {
    setStep([newStep, newDirection]);
  };

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(cleanedPhone)) {
      setErrors({ phone: "Our network requires a valid 10-digit number." });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await apiFetch("/auth/otp/send", {
        method: "POST",
        body: { phone: cleanedPhone } as never,
        auth: "omit"
      });
      addToast("A secure code has been dispatched.", "success");
      paginate("otp", 1);
    } catch (err: any) {
      addToast(err.message || "Priority request failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const validateStep1 = () => {
    if (!name.trim()) {
      setErrors({ name: "Your name is required for our records." });
      return false;
    }
    if (cleanedPhone.length !== 10) {
      setErrors({ phone: "10 digits are required for secure identification." });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleRegister = async () => {
    const nextErrors: Record<string, string> = {};
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Please use a valid elite email address.";
    if (password.length < 8) nextErrors.password = "A stronger password (min 8 chars) is required.";
    if (password !== confirmPassword) nextErrors.confirmPassword = "Security passwords must match.";
    
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: { name, phone: cleanedPhone, email, password } as never,
        auth: "omit"
      });
      paginate("otp", 1);
    } catch (err: any) {
      addToast(err.message || "The application could not be processed.", "error");
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
      addToast("Welcome to the Elite Circle.", "success");
      router.push(getDefaultRoute(user));
    } catch (err: any) {
      addToast(err.message || "Invalid access code.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[500px]"
      >
        <Card className="glass-card overflow-hidden !p-0 border-white/10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">
          {/* Top Branding / Step Indicator */}
          <div className="relative h-2 w-full bg-white/5 overflow-hidden">
             <motion.div 
               animate={{ width: step === "phone" ? "33%" : step === "account" ? "66%" : "100%" }}
               transition={{ type: "spring", stiffness: 100, damping: 20 }}
               className="h-full premium-gradient shadow-[0_0_15px_rgba(212,175,55,0.5)]"
             />
          </div>

          <div className="p-10 md:p-14">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              {step === "phone" && (
                <motion.div
                  key="phone"
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  className="space-y-8"
                >
                  <div className="text-center space-y-2">
                    <h1 className="text-4xl font-serif premium-text-gradient tracking-tight">Identity</h1>
                    <p className="text-muted-foreground text-sm font-light">Join the network of the exceptional.</p>
                  </div>

                  <div className="space-y-6">
                    <Input
                      label="Your Legal Name"
                      placeholder="e.g. Alexander Pierce"
                      className="input-premium h-14"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      error={errors.name}
                    />
                    <Input
                      label="Personal Identity (Phone)"
                      type="tel"
                      placeholder="1234567890"
                      className="input-premium h-14"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      error={errors.phone}
                      maxLength={10}
                    />
                  </div>

                  <Button 
                    className="btn-premium w-full py-7 text-lg font-medium shadow-2xl" 
                    onClick={() => { if (validateStep1()) paginate("account", 1); }}
                  >
                    Proceed to Verification
                  </Button>
                </motion.div>
              )}

              {step === "account" && (
                <motion.div
                  key="account"
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  className="space-y-6"
                >
                  <div className="text-center space-y-2">
                    <h1 className="text-4xl font-serif premium-text-gradient">Security</h1>
                    <p className="text-muted-foreground text-sm font-light">Encrypted credentials for elite privacy.</p>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Private Email (Optional)"
                      type="email"
                      placeholder="you@private.com"
                      className="input-premium h-14"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={errors.email}
                    />
                    <Input
                      label="Access Password"
                      type="password"
                      placeholder="••••••••"
                      className="input-premium h-14"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      error={errors.password}
                    />
                    <Input
                      label="Confirm Security"
                      type="password"
                      placeholder="••••••••"
                      className="input-premium h-14"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={errors.confirmPassword}
                    />
                  </div>

                  <div className="pt-6 space-y-4">
                    <Button 
                      className="btn-premium w-full py-7 text-lg" 
                      loading={loading}
                      onClick={handleRegister}
                    >
                      Initialize Verification
                    </Button>
                    <button 
                      onClick={() => paginate("phone", -1)}
                      className="w-full text-muted-foreground text-xs uppercase tracking-widest hover:text-primary transition-colors"
                    >
                      Back to Step 1
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div
                  key="otp"
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  className="space-y-10 text-center"
                >
                  <div className="space-y-3">
                    <h1 className="text-4xl font-serif premium-text-gradient">Verification</h1>
                    <p className="text-muted-foreground text-sm font-light leading-relaxed">
                      We've dispatched a unique access code to <br/>
                      <span className="text-primary font-medium tracking-wide">{phone}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-8">
                    <OtpInput onComplete={handleVerify} disabled={loading} />
                    <ResendTimer onResend={handleSendOtp} />
                  </div>

                  <div className="pt-4 flex flex-col items-center gap-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border border-white/20 flex items-center justify-center transition-all ${rememberMe ? 'bg-primary border-primary shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-white/5'}`}
                           onClick={() => setRememberMe(!rememberMe)}>
                        {rememberMe && <span className="text-[10px] text-background font-bold">✔</span>}
                      </div>
                      <span className="text-sm text-muted-foreground/80 group-hover:text-foreground transition-colors font-light">Trust this device for 30 days</span>
                    </label>
                    
                    <button 
                      onClick={() => paginate("account", -1)}
                      className="text-muted-foreground text-xs uppercase tracking-widest hover:text-primary transition-colors"
                    >
                      Incorrect Details?
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        <footer className="mt-12 text-center text-sm">
          <span className="text-muted-foreground/40 font-light">A member of our team?</span>{" "}
          <Link href="/login" className="text-primary/70 hover:text-primary transition-all font-medium border-b border-primary/20 pb-0.5 ml-1">
            Re-Authenticate
          </Link>
        </footer>
      </motion.div>
    </div>
  );
}
