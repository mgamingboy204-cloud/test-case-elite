"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ShieldCheck, Check } from "lucide-react";

const TIERS = [
  {
    id: "standard",
    label: "Standard",
    price: "$49",
    period: "/ month",
    perks: ["Global Network Access", "Curated Introductions", "Profile Visibility"],
  },
  {
    id: "elite",
    label: "Elite",
    price: "$99",
    period: "/ month",
    perks: ["Concierge Matching", "Private Protocol", "Priority Verification"],
    featured: true,
  },
];

export default function PaymentStep() {
  const { completeOnboardingStep, refreshCurrentUser } = useAuth();
  const [error, setError] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("");
  const [cardNumber, setCardNumber] = useState("");
  const [processing, setProcessing] = useState(false);

  const isValid = selectedTier !== "" && cardNumber.replace(/\s/g, "").length >= 15;

  const formatCard = (val: string) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setProcessing(true);
    try {
      const cardLast4 = cardNumber.replace(/\s/g, "").slice(-4);
      const init = await apiRequest<{ paymentRef: string }>("/payments/initiate", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ tier: selectedTier, cardLast4 })
      });
      await apiRequest("/payments/verify", {
        method: "POST",
        auth: true,
        body: JSON.stringify({ paymentRef: init.paymentRef })
      });
      await refreshCurrentUser();
      completeOnboardingStep("PROFILE");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full px-8 pb-[calc(env(safe-area-inset-bottom,0px)+32px)]">

      {/* Header */}
      <div className="flex-none pt-6 mb-8">
        <h1 className="text-4xl font-serif text-foreground tracking-wide mb-2">
          Elite <span className="text-primary">Membership</span>
        </h1>
        <p className="text-foreground/40 font-light uppercase tracking-widest text-[10px]">
          Select your tier and secure your position in the network.
        </p>
      </div>

      {/* Tier Selector */}
      <div className="flex-none grid grid-cols-2 gap-4 mb-8">
        {TIERS.map((tier) => {
          const active = selectedTier === tier.id;
          return (
            <motion.button
              key={tier.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTier(tier.id)}
              className={`relative p-5 rounded-2xl border text-left transition-all duration-400 flex flex-col gap-3 overflow-hidden ${
                active
                  ? 'bg-primary/10 border-primary shadow-[0_0_20px_rgba(200,155,144,0.12)]'
                  : 'bg-foreground/[0.02] border-foreground/8 hover:border-primary/30'
              }`}
            >
              {tier.featured && (
                <div className="absolute top-2 right-2 text-[7px] uppercase tracking-[0.25em] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
                  Preferred
                </div>
              )}
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-foreground/40 font-medium mb-1">{tier.label}</p>
                <p className="text-2xl font-light text-primary">
                  {tier.price} <span className="text-xs text-foreground/30">{tier.period}</span>
                </p>
              </div>
              <ul className="space-y-1.5">
                {tier.perks.map(p => (
                  <li key={p} className="flex items-start gap-2 text-[9px] text-foreground/50 tracking-wide">
                    <div className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
              {active && (
                <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check size={11} className="text-background" strokeWidth={2.5} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Card Input */}
      <form onSubmit={handlePayment} className="flex flex-col flex-1 gap-6">
        <div className="space-y-6">
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Card Number"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCard(e.target.value))}
              className="w-full bg-transparent border-b border-primary/30 pb-3 text-xl font-light text-foreground focus:outline-none focus:border-primary transition-all duration-400 placeholder:text-foreground/15 tracking-widest"
            />
          </div>
        </div>

        <div className="mt-auto space-y-3">
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!isValid || processing}
            className={`btn-elite-primary ${(!isValid || processing) ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}
          >
            {processing ? 'Processing Cipher...' : `Lock In Access — ${TIERS.find(t => t.id === selectedTier)?.price ?? '$—'}/mo`}
          </motion.button>
          <div className="flex justify-center items-center gap-2 text-[8px] uppercase tracking-[0.3em] text-foreground/20">
            <ShieldCheck size={11} className="text-primary/40" />
            End-to-End Encrypted Session
          </div>
        </div>
      </form>
    </div>
  );
}
