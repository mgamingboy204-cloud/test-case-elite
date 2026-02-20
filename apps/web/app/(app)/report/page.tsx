"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/ui/Card";
import { Select } from "@/app/components/ui/Select";
import { Textarea } from "@/app/components/ui/Textarea";
import { Button } from "@/app/components/ui/Button";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";

const REASONS = [
  { value: "inappropriate", label: "Inappropriate behavior" },
  { value: "fake", label: "Fake profile" },
  { value: "harassment", label: "Harassment" },
  { value: "spam", label: "Spam" },
  { value: "underage", label: "Underage user" },
  { value: "other", label: "Other" },
];

export default function ReportPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      addToast("Please specify the nature of the discrepancy.", "error");
      return;
    }
    const reportedUserId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("userId") : null;
    if (!reportedUserId) {
      addToast("The subject of the report could not be identified.", "error");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/reports", {
        method: "POST",
        body: { reportedUserId, reason, details: details || null } as never,
      });
      addToast("The discrepancy has been recorded. Our curators will investigate.", "success");
      router.push("/discover");
    } catch {
      addToast("A technical disruption occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="max-w-4xl mx-auto py-16 px-6 pb-40"
    >
      <button
        onClick={() => router.back()}
        className="flex items-center gap-5 text-muted-foreground/30 hover:text-primary transition-all duration-700 mb-16 group"
      >
        <div className="w-10 h-10 rounded-2xl border border-primary/5 flex items-center justify-center group-hover:bg-primary/5 group-hover:border-primary/10 group-hover:rotate-45 transition-all duration-700">
          <span className="text-xl group-hover:-translate-x-1 transition-transform -rotate-45">←</span>
        </div>
        <span className="text-[10px] uppercase tracking-[0.5em] font-black italic">Return to Origin</span>
      </button>

      <header className="mb-20 space-y-4">
        <h1 className="text-5xl md:text-6xl font-serif tracking-tight text-foreground/90 italic">
          Report a Discrepancy
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/30 italic">
            Maintain the Purity of the Collective
          </span>
          <div className="w-12 h-[1px] bg-primary/20" />
        </div>
      </header>

      <Card className="p-12 md:p-16 bg-white/40 backdrop-blur-3xl border-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-[4rem] transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] group overflow-hidden relative">
        <div className="max-w-xl mx-auto space-y-12 relative z-10">
          <div className="space-y-10">
            <Select
              label="Nature of Violation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              options={REASONS}
              placeholder="Select a discrepancy category"
            />
            <Textarea
              label="Additional Context (Optional)"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide a detailed narrative of the event..."
              rows={8}
              className="bg-transparent font-serif italic text-lg"
            />
          </div>

          <div className="pt-6 space-y-8">
            <Button
              variant="premium"
              fullWidth
              loading={loading}
              onClick={handleSubmit}
              className="py-8 rounded-[2rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.4em] font-black"
            >
              Submit Reporting Fragment
            </Button>
            <div className="flex flex-col items-center gap-3 opacity-20">
              <div className="w-12 h-px bg-primary/40" />
              <p className="text-center text-[9px] uppercase tracking-[0.6em] font-black text-muted-foreground italic">
                Reports are processed within 24 standard cycles.
              </p>
            </div>
          </div>
        </div>

        {/* Aesthetic Background Detail */}
        <div className="absolute -right-32 -bottom-32 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/10 transition-all duration-1000" />
      </Card>
    </motion.div>
  );
}
