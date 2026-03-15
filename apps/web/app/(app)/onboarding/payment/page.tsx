"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { ShieldCheck, Check } from "lucide-react";

type PlanId = "ONE_MONTH" | "FIVE_MONTHS" | "TWELVE_MONTHS";

type PaymentStatus = "NOT_STARTED" | "PENDING" | "PAID" | "FAILED" | "CANCELED";

interface PaymentOverview {
  paymentStatus: PaymentStatus;
  onboardingStep: string;
  plans: Array<{
    plan: PlanId;
    amountInr: number;
    durationMonths: number;
    taxIncluded: boolean;
    autoRenew: boolean;
    renewalPolicy: "MANUAL_ONLY";
  }>;
  subscription: {
    status: string;
    startedAt: string | null;
    endsAt: string | null;
    manualRenewalRequired: boolean;
  };
}

const PLAN_COPY: Record<PlanId, { label: string; price: string }> = {
  ONE_MONTH: { label: "1 Month", price: "INR 30,000" },
  FIVE_MONTHS: { label: "5 Months", price: "INR 70,000" },
  TWELVE_MONTHS: { label: "12 Months", price: "INR 100,000" }
};

const FAILURE_MESSAGE =
  "Payment could not be completed. Please contact premium support on WhatsApp — our team responds within 1 to 2 hours.";

export default function PaymentStep() {
  const { completeOnboardingStep, refreshCurrentUser } = useAuth();
  const [error, setError] = useState("");
  const [selectedTier, setSelectedTier] = useState<PlanId | "">("");
  const [cardNumber, setCardNumber] = useState("");
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<PaymentOverview | null>(null);

  const formattedPlans = useMemo(() => {
    return overview?.plans.map((plan) => ({
      ...plan,
      label: PLAN_COPY[plan.plan].label,
      price: PLAN_COPY[plan.plan].price,
      perks: ["Private Club Access", "Curated Discovery", "Premium Member Support"]
    })) ?? [];
  }, [overview]);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const data = await apiRequest<PaymentOverview>("/payments/me", { auth: true });
        setOverview(data);

        if (data.paymentStatus === "PAID") {
          await refreshCurrentUser();
          completeOnboardingStep("PROFILE");
          return;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load membership plans.");
      } finally {
        setLoading(false);
      }
    };

    void loadOverview();
  }, [completeOnboardingStep, refreshCurrentUser]);

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
      if (err instanceof ApiError) {
        try {
          await apiRequest("/payments/fail", {
            method: "POST",
            auth: true,
            body: JSON.stringify({ reason: FAILURE_MESSAGE })
          });
        } catch {
          // fallback on frontend messaging only
        }
        setError(err.body && typeof err.body === "object" && "message" in (err.body as Record<string, unknown>)
          ? String((err.body as Record<string, unknown>).message)
          : FAILURE_MESSAGE);
      } else {
        setError(FAILURE_MESSAGE);
      }
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="flex h-full items-center justify-center text-sm text-foreground/50">Loading membership plans…</div>;
  }

  if (!overview) {
    return <div className="flex h-full items-center justify-center text-sm text-red-400">{error || "Unable to load payment."}</div>;
  }

  return (
    <div className="flex flex-col h-full px-8 pb-[calc(env(safe-area-inset-bottom,0px)+32px)]">
      <div className="flex-none pt-6 mb-8">
        <h1 className="text-4xl font-serif text-foreground tracking-wide mb-2">
          Elite <span className="text-primary">Membership</span>
        </h1>
        <p className="text-foreground/40 font-light uppercase tracking-widest text-[10px]">
          Tax included. Manual renewal only — auto-renew is disabled for all members.
        </p>
      </div>

      <div className="flex-none grid grid-cols-1 gap-4 mb-8">
        {formattedPlans.map((tier) => {
          const active = selectedTier === tier.plan;
          return (
            <motion.button
              key={tier.plan}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTier(tier.plan)}
              className={`relative p-5 rounded-2xl border text-left transition-all duration-400 flex flex-col gap-3 overflow-hidden ${
                active
                  ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(200,155,144,0.12)]"
                  : "bg-foreground/[0.02] border-foreground/8 hover:border-primary/30"
              }`}
            >
              <div>
                <p className="text-[9px] uppercase tracking-[0.3em] text-foreground/40 font-medium mb-1">{tier.label}</p>
                <p className="text-2xl font-light text-primary">{tier.price}</p>
              </div>
              <ul className="space-y-1.5">
                {tier.perks.map((p) => (
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
          {error && <p className="text-sm text-red-400 text-center">{error || FAILURE_MESSAGE}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!isValid || processing}
            className={`btn-elite-primary ${!isValid || processing ? "opacity-20 grayscale cursor-not-allowed" : ""}`}
          >
            {processing ? "Processing…" : `Complete Payment — ${selectedTier ? PLAN_COPY[selectedTier].price : "INR —"}`}
          </motion.button>
          <p className="text-center text-[11px] text-foreground/50">
            Payment issues? Contact premium WhatsApp support. Response time: 1 to 2 hours.
          </p>
          <div className="flex justify-center items-center gap-2 text-[8px] uppercase tracking-[0.3em] text-foreground/20">
            <ShieldCheck size={11} className="text-primary/40" />
            End-to-End Encrypted Session
          </div>
        </div>
      </form>
    </div>
  );
}
