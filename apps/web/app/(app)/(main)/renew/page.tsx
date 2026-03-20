"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequestAuth } from "@/lib/api";
import { allowTestBypass, useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { motion } from "framer-motion";
import { Check, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

type PlanId = "ONE_MONTH" | "FIVE_MONTHS" | "TWELVE_MONTHS";

type PaymentStatus = "NOT_STARTED" | "PENDING" | "PAID" | "FAILED" | "CANCELED";

interface PaymentOverview {
  paymentStatus: PaymentStatus;
  onboardingStep: string;
  plans: Array<{ plan: PlanId; amountInr: number; durationMonths: number; taxIncluded: boolean; autoRenew: boolean; renewalPolicy: "MANUAL_ONLY" }>;
}

type PaymentInitResponse =
  | {
      paymentRef: string;
      gateway: "razorpay";
      razorpay: { keyId: string; orderId: string; amountPaise: number; currency: string };
    }
  | {
      paymentRef: string;
      gateway: "mock";
      mock: { orderId: string; paymentId: string; signature: string };
    };

type RazorpayVerificationPayload = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayVerificationPayload) => void | Promise<void>;
  modal: {
    ondismiss: () => void | Promise<void>;
  };
};

type RazorpayCheckoutInstance = {
  open: () => void;
};

type RazorpayCheckoutConstructor = new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;

const PLAN_COPY: Record<PlanId, { label: string; price: string }> = {
  ONE_MONTH: { label: "1 Month", price: "INR 30,000" },
  FIVE_MONTHS: { label: "5 Months", price: "INR 70,000" },
  TWELVE_MONTHS: { label: "12 Months", price: "INR 100,000" }
};

const FAILURE_MESSAGE =
  "Payment could not be completed. Please contact premium support on WhatsApp — our team responds within 1 to 2 hours.";

function getRazorpayConstructor() {
  if (typeof window === "undefined") return null;
  return (window as Window & typeof globalThis & { Razorpay?: RazorpayCheckoutConstructor }).Razorpay ?? null;
}

async function ensureRazorpayCheckoutLoaded() {
  if (typeof window === "undefined") return false;
  if (getRazorpayConstructor()) return true;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout."));
    document.body.appendChild(script);
  });

  return Boolean(getRazorpayConstructor());
}

export default function RenewMembershipPage() {
  const router = useRouter();
  const { refreshCurrentUser } = useAuth();

  const [error, setError] = useState("");
  const [selectedTier, setSelectedTier] = useState<PlanId | "">("");
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<PaymentOverview | null>(null);

  const formattedPlans = useMemo(() => {
    return (
      overview?.plans.map((plan) => ({
        ...plan,
        label: PLAN_COPY[plan.plan].label,
        price: PLAN_COPY[plan.plan].price,
        perks: ["Private Club Access", "Curated Discovery", "Premium Member Support"]
      })) ?? []
    );
  }, [overview]);

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const data = await apiRequestAuth<PaymentOverview>(API_ENDPOINTS.payments.overview);
        setOverview(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load membership plans.");
      } finally {
        setLoading(false);
      }
    };

    void loadOverview();
  }, []);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTier) return;

    setError("");
    setProcessing(true);
    try {
      const init = await apiRequestAuth<PaymentInitResponse>(API_ENDPOINTS.payments.initiate, {
        method: "POST",
        body: JSON.stringify({ tier: selectedTier })
      });

      if (init.gateway === "mock") {
        await apiRequestAuth(API_ENDPOINTS.payments.verify, {
          method: "POST",
          body: JSON.stringify({
            orderId: init.mock.orderId,
            paymentId: init.mock.paymentId,
            signature: init.mock.signature
          })
        });
      } else {
        const loaded = await ensureRazorpayCheckoutLoaded();
        const Razorpay = getRazorpayConstructor();
        if (!loaded || !Razorpay) throw new Error("Payment gateway unavailable.");

        await new Promise<void>((resolve, reject) => {
          const paymentObject = new Razorpay({
            key: init.razorpay.keyId,
            amount: init.razorpay.amountPaise,
            currency: init.razorpay.currency,
            order_id: init.razorpay.orderId,
            name: "VAEL Membership",
            description: `Membership ${selectedTier}`,
            handler: async (response: RazorpayVerificationPayload) => {
              try {
                await apiRequestAuth(API_ENDPOINTS.payments.verify, {
                  method: "POST",
                  body: JSON.stringify({
                    orderId: response.razorpay_order_id,
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature
                  })
                });
                resolve();
              } catch (verificationError) {
                reject(verificationError);
              }
            },
            modal: {
              ondismiss: async () => {
                await apiRequestAuth(API_ENDPOINTS.payments.fail, {
                  method: "POST",
                  body: JSON.stringify({ reason: "Payment canceled by user." })
                });
                reject(new Error("Payment canceled."));
              }
            }
          });

          paymentObject.open();
        });
      }

      await refreshCurrentUser();
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : FAILURE_MESSAGE);
    } finally {
      setProcessing(false);
    }
  };

  const handleMockPayment = async () => {
    if (!allowTestBypass) return;
    if (!selectedTier) {
      setError("Select a membership plan first.");
      return;
    }

    setProcessing(true);
    setError("");
    try {
      await apiRequestAuth<PaymentInitResponse>(API_ENDPOINTS.payments.initiate, {
        method: "POST",
        body: JSON.stringify({ tier: selectedTier })
      });
      await apiRequestAuth(API_ENDPOINTS.payments.mockComplete, { method: "POST" });
      await refreshCurrentUser();
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mock payment failed.");
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
          VAEL <span className="text-primary">Renewal</span>
        </h1>
      </div>

      <div className="flex-none grid grid-cols-1 gap-4 mb-8">
        {formattedPlans.map((tier) => {
          const active = selectedTier === tier.plan;
          return (
            <motion.button
              key={tier.plan}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedTier(tier.plan)}
              className={`relative p-5 rounded-2xl border text-left ${
                active ? "bg-primary/10 border-primary" : "bg-foreground/[0.02] border-foreground/8"
              }`}
            >
              <p className="text-[9px] uppercase tracking-[0.3em] text-foreground/40 font-medium mb-1">{tier.label}</p>
              <p className="text-2xl font-light text-primary">{tier.price}</p>
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
        {error ? <p className="text-sm text-red-400 text-center">{error || FAILURE_MESSAGE}</p> : null}
        <div className="mt-auto space-y-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={!selectedTier || processing}
            className={`btn-vael-primary ${!selectedTier || processing ? "opacity-20 grayscale cursor-not-allowed" : ""}`}
          >
            {processing ? "Processing…" : `Pay with Razorpay — ${selectedTier ? PLAN_COPY[selectedTier].price : "INR —"}`}
          </motion.button>

          {allowTestBypass && (
            <button
              type="button"
              onClick={() => void handleMockPayment()}
              className="w-full text-xs uppercase tracking-[0.2em] text-amber-300 hover:text-amber-200"
              disabled={!selectedTier || processing}
            >
              Proceed with Mock Payment
            </button>
          )}

          <div className="flex justify-center items-center gap-2 text-[8px] uppercase tracking-[0.3em] text-foreground/20">
            <ShieldCheck size={11} className="text-primary/40" /> End-to-End Encrypted Session
          </div>
        </div>
      </form>
    </div>
  );
}

