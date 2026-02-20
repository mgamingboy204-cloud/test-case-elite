"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/ui/Card";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

const benefits = [
  "Limitless discoveries and curated interests",
  "Unmask the identities of your admirers",
  "Priority placement in the discovery orchestrator",
  "Prestigious Biometric Verified Badge",
  "Concierge-level support access",
  "An orchestrated experience without distractions",
];

export default function PaymentPage() {
  const { addToast } = useToast();
  const [coupon, setCoupon] = useState("");
  const [couponValid, setCouponValid] = useState<boolean | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [step, setStep] = useState<"plan" | "confirm" | "done">("plan");
  const [loading, setLoading] = useState(false);

  const handleValidateCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      await apiFetch("/payments/coupon/validate", {
        method: "POST",
        body: { code: coupon } as never,
      });
      setCouponValid(true);
      addToast("Discount fragment successfully applied.", "success");
    } catch {
      setCouponValid(false);
      addToast("The provided code is invalid.", "error");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleStartPayment = async () => {
    setLoading(true);
    try {
      await apiFetch("/payments/mock/start", { method: "POST" });
      setStep("confirm");
    } catch {
      addToast("Failed to initialize fiscal bridge.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      await apiFetch("/payments/mock/confirm", { method: "POST" });
      setStep("done");
      addToast("Payment successfully finalized.", "success");
    } catch {
      addToast("Fiscal confirmation failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-16 px-6 pb-40 relative z-10">
      <AnimatePresence mode="wait">
        {step === "plan" && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-16"
          >
            <header className="space-y-4 text-center md:text-left">
              <h1 className="text-5xl md:text-6xl font-serif text-foreground/90 italic tracking-tight">The Membership</h1>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 italic">
                  Elevate Your Presence Within the Collective
                </span>
                <div className="hidden md:block w-12 h-[1px] bg-primary/20" />
              </div>
            </header>

            <Card className="p-12 md:p-16 bg-white/40 backdrop-blur-3xl border-white/60 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.1)] rounded-[4rem] group overflow-hidden relative">
              <div className="flex flex-col lg:flex-row gap-20 relative z-10">
                {/* Left Side: Plan & Benefits */}
                <div className="flex-1 space-y-12">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_15px_rgba(232,165,178,0.5)]" />
                      <h3 className="text-3xl font-serif text-foreground/80 italic">The Elite Tier</h3>
                    </div>
                    <p className="text-lg text-muted-foreground/50 font-serif italic leading-relaxed pr-12 border-l-2 border-primary/20 pl-6">
                      A monthly dedication to curate your most significant connections with absolute precision and grace.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    {benefits.map((b) => (
                      <div key={b} className="flex gap-4 items-start group">
                        <div className="mt-1 w-6 h-6 rounded-xl border border-primary/10 flex items-center justify-center bg-white/40 shadow-sm group-hover:bg-primary group-hover:border-primary transition-all duration-700 group-hover:rotate-12">
                          <span className="text-primary group-hover:text-white transition-colors text-[10px]">✓</span>
                        </div>
                        <span className="text-sm text-foreground/60 font-medium group-hover:text-foreground transition-colors italic leading-tight">{b}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side: Pricing & Coupon */}
                <div className="lg:w-96 space-y-12">
                  <div className="p-12 rounded-[3rem] bg-gradient-to-br from-primary/[0.05] to-transparent border border-white/60 text-center space-y-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.03)] group-hover:shadow-[0_40px_80px_-20px_rgba(232,165,178,0.15)] transition-all duration-1000">
                    <p className="text-[10px] uppercase tracking-[0.4em] font-black text-primary/40 italic">Monthly Endowment</p>
                    <div className="text-6xl font-serif italic text-primary drop-shadow-sm flex items-center justify-center gap-1">
                      $29
                      <span className="text-[10px] font-sans font-black uppercase tracking-[0.4em] text-primary/20 mt-4 h-full">/mo</span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex gap-3">
                      <Input
                        placeholder="DISCOUNT_FRAGMENT"
                        value={coupon}
                        onChange={(e) => {
                          setCoupon(e.target.value);
                          setCouponValid(null);
                        }}
                        className={`bg-white/40 backdrop-blur-3xl font-mono text-[10px] tracking-widest uppercase transition-all duration-1000 rounded-2xl ${couponValid === true ? "border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.1)]" :
                          couponValid === false ? "border-red-300" : "border-white/60"
                          }`}
                      />
                      <Button
                        variant="secondary"
                        loading={couponLoading}
                        onClick={handleValidateCoupon}
                        className="px-8 rounded-2xl text-[10px] uppercase tracking-widest font-black transition-all duration-700"
                      >
                        Apply
                      </Button>
                    </div>

                    <Button
                      variant="premium"
                      fullWidth
                      onClick={handleStartPayment}
                      loading={loading}
                      className="py-8 rounded-[2.5rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black"
                    >
                      Secure Endowment
                    </Button>
                  </div>
                </div>
              </div>

              {/* Cinematic Background Detail */}
              <div className="absolute -right-48 -top-48 w-96 h-96 bg-primary/5 rounded-full blur-[150px] pointer-events-none group-hover:bg-primary/10 transition-all duration-1000" />
            </Card>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto pt-24"
          >
            <Card className="p-16 text-center bg-white/40 backdrop-blur-3xl border-white/60 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.1)] rounded-[4rem] space-y-12">
              <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 rotate-12">
                <span className="text-4xl text-primary font-serif italic -rotate-12">$</span>
              </div>

              <div className="space-y-4">
                <h3 className="text-4xl font-serif text-foreground/80 italic tracking-tight">Fiscal Confirmation</h3>
                <p className="text-lg text-muted-foreground/50 leading-relaxed italic font-serif">
                  Proceed with the monthly endowment of <strong className="text-primary font-medium tracking-wide">$29.00</strong> to formalize your Elite identity within the collective.
                </p>
              </div>

              <div className="flex gap-6">
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => setStep("plan")}
                  className="py-8 rounded-[2rem] text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/30 hover:text-foreground transition-all duration-700 italic"
                >
                  ← Return
                </Button>
                <Button
                  variant="premium"
                  fullWidth
                  loading={loading}
                  onClick={handleConfirmPayment}
                  className="py-8 rounded-[2rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black"
                >
                  Authorize Entry
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, filter: "blur(20px)", scale: 0.95 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl mx-auto pt-24"
          >
            <Card className="p-16 md:p-20 text-center bg-white/40 backdrop-blur-3xl border-white/60 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.1)] rounded-[4.5rem] space-y-12 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

              <div className="w-28 h-28 rounded-[2.5rem] bg-emerald-50/50 flex items-center justify-center mx-auto border border-emerald-100 shadow-2xl shadow-emerald-500/10 rotate-12">
                <motion.span
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: -12 }}
                  transition={{ type: "spring", damping: 15, stiffness: 250, delay: 0.5 }}
                  className="text-5xl text-emerald-500"
                >
                  ✓
                </motion.span>
              </div>

              <div className="space-y-6">
                <h2 className="text-5xl font-serif text-foreground/90 italic tracking-tight">Welcome, Elite Member</h2>
                <div className="flex flex-col items-center gap-3">
                  <p className="text-[11px] text-primary font-black uppercase tracking-[0.6em] italic">Identity Status: REDEFINED</p>
                  <div className="w-12 h-[1px] bg-primary/20" />
                </div>
                <p className="text-lg text-muted-foreground/50 font-serif italic leading-relaxed max-w-sm mx-auto pt-4 border-l-2 border-emerald-100 pl-6 text-left">
                  Your presence within the collective has been successfully elevated. Your journey into significant, curated connections begins this very cycle.
                </p>
              </div>

              <Badge className="bg-emerald-50/50 text-emerald-600 border-emerald-100/50 px-10 py-3 rounded-full text-[10px] uppercase tracking-[0.4em] font-black italic">
                Active Protocol Alpha
              </Badge>

              <div className="pt-8">
                <Link href="/onboarding/profile">
                  <Button variant="premium" size="xl" fullWidth className="py-8 rounded-[2.5rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.5em] font-black">
                    Begin Identity Synthesis
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
