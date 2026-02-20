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

type Step = "phone" | "otp" | "account";

export default function SignupPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();
  
  const [step, setStep] = useState<Step>("phone");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Data
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const cleanedPhone = useMemo(() => phone.replace(/\D/g, ""), [phone]);

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(cleanedPhone)) {
      setErrors({ phone: "Enter a valid 10-digit phone number" });
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
      addToast("Verification code sent to your device.", "success");
      setStep("otp");
    } catch (err: any) {
      addToast(err.message || "Failed to send code", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    try {
      // In this flow, OTP verification happens before account creation or as part of it?
      // Looking at the original backend: /auth/register creates a PendingUser and then asks for OTP.
      // IMPROVISATION: We keep the original logic but make it feel seamless.
      // We'll move to 'account' step after OTP verify, but wait— 
      // original backend verifyOtp returns a User. We need to follow original logic carefully.
      
      // Let's stick to: Account Details -> OTP. (Original Logic)
      // BUT make it LOOK like: Phone -> OTP -> Account.
      // To do this safely without breaking backend logic, I'll stick to 
      // Account -> OTP but improve the visuals.
      
      setStep("otp"); 
    } catch {
      addToast("Invalid OTP", "error");
    } finally {
      setLoading(false);
    }
  };

  const validateAccount = () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!/^\d{10}$/.test(cleanedPhone)) nextErrors.phone = "10-digit phone required";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Invalid email";
    if (password.length < 8) nextErrors.password = "Minimum 8 characters";
    if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleFinalRegister = async () => {
    if (!validateAccount()) return;
    setLoading(true);
    try {
      await apiFetch("/auth/register", {
        method: "POST",
        body: { name, phone: cleanedPhone, email, password } as never,
        auth: "omit"
      });
      setStep("otp");
    } catch (err: any) {
      addToast(err.message || "Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteVerify = async (code: string) => {
    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken?: string }>("/auth/otp/verify", {
        method: "POST",
        body: { phone: cleanedPhone, code, rememberMe } as never,
        auth: "omit"
      });
      if (res?.accessToken) setAccessToken(res.accessToken);
      const user = await refresh();
      addToast("Welcome to the Elite Network", "success");
      router.push(getDefaultRoute(user));
    } catch (err: any) {
      addToast(err.message || "Invalid Code", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px]"
      >
        <Card className="glass-card overflow-hidden !p-0 border-white/10">
          {/* Progress Bar */}
          <div className="h-1 w-full bg-white/5 flex">
             <motion.div 
               animate={{ width: step === "phone" ? "33%" : step === "otp" ? "100%" : "66%" }}
               className="h-full premium-gradient"
             />
          </div>

          <div className="p-8 md:p-10">
            <header className="mb-8 text-center">
               <h1 className="text-3xl font-serif premium-text-gradient mb-2">Begin Your Journey</h1>
               <p className="text-muted-foreground text-sm">
                 {step === "phone" && "Step 1: Secure your identity"}
                 {step === "account" && "Step 2: Create your elite profile"}
                 {step === "otp" && "Step 3: Verification required"}
               </p>
            </header>

            <AnimatePresence mode="wait">
              {step === "phone" && (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <Input
                      label="Full Legal Name"
                      placeholder="As it appears on ID"
                      className="input-premium"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      error={errors.name}
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="1234567890"
                      className="input-premium"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      error={errors.phone}
                      maxLength={10}
                    />
                  </div>
                  <Button 
                    className="btn-premium w-full py-6 text-lg font-medium tracking-wide" 
                    loading={loading} 
                    onClick={() => {
                       if (name && cleanedPhone.length === 10) setStep("account");
                       else setErrors({ name: !name ? "Required" : "", phone: cleanedPhone.length !== 10 ? "10 digits required" : "" });
                    }}
                  >
                    Continue
                  </Button>
                </motion.div>
              )}

              {step === "account" && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <Input
                    label="Email Address (Optional)"
                    type="email"
                    placeholder="you@elite.com"
                    className="input-premium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={errors.email}
                  />
                  <Input
                    label="Security Password"
                    type="password"
                    placeholder="••••••••"
                    className="input-premium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={errors.password}
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    placeholder="••••••••"
                    className="input-premium"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={errors.confirmPassword}
                  />
                  
                  <div className="pt-4 space-y-3">
                    <Button 
                      className="btn-premium w-full py-6 text-lg" 
                      loading={loading} 
                      onClick={handleFinalRegister}
                    >
                      Request Invite Code
                    </Button>
                    <button 
                      onClick={() => setStep("phone")}
                      className="w-full text-muted-foreground text-xs hover:text-primary transition-colors"
                    >
                      Return to Step 1
                    </button>
                  </div>
                </motion.div>
              )}

              {step === "otp" && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8 text-center"
                >
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">
                      We've sent a 6-digit access code to <span className="text-primary font-medium">{phone}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <OtpInput onComplete={handleCompleteVerify} disabled={loading} />
                    <ResendTimer onResend={handleSendOtp} />
                  </div>

                  <div className="flex flex-col gap-4">
                    <label className="flex items-center justify-center gap-3 cursor-pointer group">
                      <div className={`w-5 h-5 rounded border border-white/20 flex items-center justify-center transition-colors ${rememberMe ? 'bg-primary border-primary' : 'bg-white/5'}`}
                           onClick={() => setRememberMe(!rememberMe)}>
                        {rememberMe && <span className="text-[10px] text-background">✔</span>}
                      </div>
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Trust this device for 30 days</span>
                    </label>
                    
                    <button 
                      onClick={() => setStep("account")}
                      className="text-muted-foreground text-xs hover:text-primary transition-colors"
                    >
                      Wrong details? Edit profile
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        <footer className="mt-8 text-center text-sm text-muted-foreground/50">
          Already a member?{" "}
          <Link href="/login" className="text-primary/80 hover:text-primary transition-colors font-medium">
            Sign In
          </Link>
        </footer>
      </motion.div>
    </div>
  );
}
