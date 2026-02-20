"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/ui/Card";
import { Textarea } from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ErrorState } from "@/app/components/ui/States";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

interface RefundStatus {
  eligible: boolean;
  status: "NONE" | "PENDING" | "APPROVED" | "DENIED";
  reason?: string;
}

export default function RefundsPage() {
  const { addToast } = useToast();
  const [refund, setRefund] = useState<RefundStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [reason, setReason] = useState("");

  const fetchRefund = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await apiFetch<any>("/refunds/me");
      const refunds = Array.isArray(data?.refunds) ? data.refunds : [];
      const latest = refunds[0];
      if (!latest) {
        setRefund({ eligible: true, status: "NONE" });
      } else {
        setRefund({ eligible: true, status: latest.status, reason: latest.reason ?? undefined });
      }
    } catch {
      setRefund({ eligible: true, status: "NONE" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefund();
  }, []);

  const handleRequest = async () => {
    if (!reason.trim()) {
      addToast("Please provide a narrative for your request.", "error");
      return;
    }
    setRequesting(true);
    try {
      await apiFetch("/refunds/request", {
        method: "POST",
        body: { reason } as never,
      });
      setRefund((prev) => (prev ? { ...prev, status: "PENDING" } : prev));
      addToast("Your request for reconciliation has been received.", "success");
    } catch {
      addToast("A technical disruption occurred during submission.", "error");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 px-6 space-y-16">
        <header className="space-y-6">
          <Skeleton className="h-16 w-64 rounded-2xl" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </header>
        <Skeleton className="h-96 rounded-[4rem]" />
      </div>
    );
  }

  if (error || !refund) return <ErrorState onRetry={fetchRefund} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto py-16 px-6 pb-40"
    >
      <header className="mb-20 space-y-4">
        <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-foreground/90 italic">
          Fiscal Policies
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 italic">
            Reconciliation & Transparency
          </span>
          <div className="w-12 h-[1px] bg-primary/20" />
        </div>
      </header>

      <Card className="p-12 md:p-16 bg-white/40 backdrop-blur-3xl border-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-[4rem] transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] group">
        <div className="flex justify-between items-center mb-12 pb-10 border-b border-primary/5">
          <div className="space-y-2">
            <h3 className="text-2xl font-serif text-foreground/80 italic">Audit Status</h3>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/30 italic">Liaison Request Tracking</p>
          </div>
          <Badge
            className={`px-8 py-3 rounded-full border shadow-sm text-[10px] uppercase tracking-[0.3em] font-black transition-all duration-700 ${refund.status === "APPROVED"
              ? "bg-emerald-50/50 text-emerald-600 border-emerald-100/50"
              : refund.status === "DENIED"
                ? "bg-red-50/50 text-red-600 border-red-100/50"
                : refund.status === "PENDING"
                  ? "bg-amber-50/50 text-amber-600 border-amber-100/50"
                  : "bg-primary/5 text-primary/40 border-primary/10"
              }`}
          >
            {refund.status === "NONE" ? "No Active Request" : refund.status}
          </Badge>
        </div>

        <div className="space-y-12">
          {refund.status === "NONE" && refund.eligible ? (
            <div className="space-y-10">
              <p className="text-lg text-muted-foreground/50 italic font-serif leading-relaxed pr-8">
                Your account is currently eligible for a reconciliation request. Please provide a formal narrative detailing your requirements below.
              </p>
              <Textarea
                label="Narrative of Intent"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Detail your request for our fiscal curators..."
                rows={8}
                className="bg-transparent text-lg font-serif italic"
              />
              <div className="pt-4">
                <Button
                  variant="premium"
                  fullWidth
                  loading={requesting}
                  onClick={handleRequest}
                  className="py-8 rounded-[2rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black"
                >
                  Submit Reconciliation Fragment
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative overflow-hidden p-12 md:p-16 rounded-[3.5rem] bg-white/40 border border-white/80 shadow-inner text-center space-y-6 transition-all duration-700">
              {refund.status === "PENDING" && (
                <>
                  <p className="text-[11px] uppercase tracking-[0.5em] font-black text-amber-600 animate-pulse">Under Curatorial Review</p>
                  <p className="text-2xl font-serif italic text-foreground/70 leading-relaxed max-w-lg mx-auto">
                    Your request is currently being processed by our fiscal liaisons. Outcome will be communicated via your secure identity channel.
                  </p>
                </>
              )}
              {refund.status === "APPROVED" && (
                <>
                  <p className="text-[11px] uppercase tracking-[0.5em] font-black text-emerald-600">Finalized & Approved</p>
                  <p className="text-2xl font-serif italic text-foreground/70 leading-relaxed max-w-lg mx-auto">
                    The reconciliation has been successfully processed. The fiscal fragment will appear in your ledger within 5-10 business cycles.
                  </p>
                </>
              )}
              {refund.status === "DENIED" && (
                <>
                  <p className="text-[11px] uppercase tracking-[0.5em] font-black text-red-600">Request Declined</p>
                  <p className="text-2xl font-serif italic text-foreground/70 leading-relaxed max-w-lg mx-auto">
                    Upon curatorial review, your request could not be finalized. Please contact our concierge for further clarification.
                  </p>
                </>
              )}

              {/* Aesthetic Background element */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent pointer-events-none" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
