"use client";

import { useState } from "react";
import { PhoneInput } from "@/components/auth/phone-input";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function SignIn() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && phone.length === 10) {
      setStep(2);
    } else if (step === 2 && password.length >= 6) {
      handleSignIn();
    }
  };

  const handleSignIn = async () => {
    setLoading(true);
    setTimeout(() => {
      login(phone);
    }, 1200);
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-serif text-white tracking-wide">Enter the <span className="text-[#C89B90]">Vault</span>.</h1>
              <p className="text-white/40 font-light text-sm uppercase tracking-widest">Identify yourself with your number.</p>
            </div>

            <form onSubmit={handleNext} className="flex flex-col gap-12">
              <PhoneInput value={phone} onChange={setPhone} />
              <button 
                type="submit" 
                disabled={phone.length !== 10}
                className="btn-elite-primary disabled:opacity-20 disabled:grayscale"
              >
                Identification Proceed
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-xs text-white/30 tracking-widest uppercase">
                New Prospect? <Link href="/signup/phone" className="text-[#C89B90] hover:underline">Request Access</Link>
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col gap-2">
              <button onClick={() => setStep(1)} className="text-[#C89B90] text-[10px] uppercase tracking-[0.3em] font-medium mb-4 flex items-center gap-2 hover:opacity-70 transition-opacity">
                <span className="text-lg">←</span> Back
              </button>
              <h1 className="text-4xl font-serif text-white tracking-wide">Secure <span className="text-[#C89B90]">Access</span>.</h1>
              <p className="text-white/40 font-light text-sm uppercase tracking-widest">Your unique encryption key.</p>
            </div>

            <form onSubmit={handleNext} className="flex flex-col gap-12">
              <Input 
                type="password" 
                placeholder="Unique Key" 
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              <button 
                type="submit" 
                disabled={password.length < 6 || loading}
                className="btn-elite-primary disabled:opacity-20 disabled:grayscale"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  "Initiate Session"
                )}
              </button>
            </form>

            <div className="text-center">
              <button type="button" className="text-[10px] uppercase tracking-widest text-white/30 hover:text-[#C89B90] transition-colors">Forgotten Encryption Key?</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
