"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ErrorState } from "@/app/components/ui/States";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { getDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";
import { motion, AnimatePresence } from "framer-motion";

type VStatus = "NOT_REQUESTED" | "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "APPROVED" | "REJECTED";

const statusConfig: Record<VStatus, { label: string; color: string; desc: string; icon: string }> = {
  NOT_REQUESTED: { 
    label: "Identity Verification", 
    color: "primary", 
    desc: "To maintain our community's excellence, we require a brief video verification. Our concierge team will review your identity securely.",
    icon: "👤"
  },
  REQUESTED: { 
    label: "In Queue", 
    color: "warning", 
    desc: "Your request has been received. A member of our verification team will be with you shortly. Please stay on this page.",
    icon: "⏳"
  },
  IN_PROGRESS: { 
    label: "Verification Active", 
    color: "primary", 
    desc: "Your session is now being prioritized. Verification is in progress. Do not close this window.",
    icon: "📡"
  },
  COMPLETED: { 
    label: "Identity Confirmed", 
    color: "success", 
    desc: "Your identity has been successfully verified. Welcome to the elite tier.",
    icon: "✨"
  },
  APPROVED: { 
    label: "Identity Confirmed", 
    color: "success", 
    desc: "Your identity has been successfully verified. Welcome to the elite tier.",
    icon: "✨"
  },
  REJECTED: { 
    label: "Verification Failed", 
    color: "danger", 
    desc: "We were unable to verify your identity. This may be due to lighting or document clarity. Please try again.",
    icon: "❗"
  }
};

export default function VideoVerificationPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { user, refresh } = useSession();
  const [status, setStatus] = useState<VStatus>("NOT_REQUESTED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const isVerified = status === "COMPLETED" || status === "APPROVED";

  const fetchStatus = async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const data = await apiFetch<{ status: VStatus }>("/me/verification-status");
      setStatus(data.status ?? "NOT_REQUESTED");
      setLastUpdatedAt(new Date());
      
      const refreshedUser = await refresh();
      if (refreshedUser) {
        const nextRoute = getDefaultRoute(refreshedUser);
        if (nextRoute !== "/onboarding/video-verification" && nextRoute !== "/onboarding/video-verification/") {
          router.replace(nextRoute);
        }
      }
    } catch {
      if (initial) setError(true);
    } finally {
      if (initial) setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStatus(true);
  }, []);

  useEffect(() => {
    if (isVerified) return;
    const timer = window.setInterval(() => {
      void fetchStatus(false);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isVerified]);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await apiFetch("/verification-requests", { method: "POST" });
      setStatus("REQUESTED");
      addToast("Your verification request is now being prioritized.", "success");
    } catch (err: any) {
      addToast(err.message || "Priority request failed.", "error");
    } finally {
      setRequesting(false);
    }
  };

  const config = useMemo(() => statusConfig[status], [status]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto space-y-6 pt-12">
        <Skeleton className="h-10 w-48 mx-auto" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState onRetry={() => fetchStatus(true)} />;
  }

  return (
    <div className="max-w-xl mx-auto px-4 pt-10 pb-20">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-serif premium-text-gradient mb-3">Identity Concierge</h1>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Ensuring the integrity and exclusivity of the Elite network through secure verification.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="glass-card !p-0 overflow-hidden border-white/10 shadow-2xl">
            <div className="p-8 md:p-10 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl border border-white/10">
                  {config.icon}
                </div>
              </div>

              <div className="flex flex-col items-center gap-2 mb-6">
                 <h2 className="text-2xl font-serif text-foreground">{config.label}</h2>
                 <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Live Status</span>
                 </div>
              </div>

              <p className="text-muted-foreground leading-relaxed mb-8 max-w-sm mx-auto">
                {config.desc}
              </p>

              <div className="space-y-4">
                {status === "NOT_REQUESTED" && (
                  <Button 
                    className="btn-premium w-full py-7 text-lg shadow-xl" 
                    loading={requesting} 
                    onClick={handleRequest}
                  >
                    Start Verification
                  </Button>
                )}

                {(status === "REQUESTED" || status === "IN_PROGRESS") && (
                  <div className="space-y-6">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         animate={{ x: ["-100%", "100%"] }}
                         transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                         className="h-full w-1/3 premium-gradient"
                       />
                    </div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
                       Connecting to verifier...
                    </p>
                  </div>
                )}

                {isVerified && (
                  <Link href="/onboarding/payment">
                    <Button className="btn-premium w-full py-7 text-lg">Continue to Membership</Button>
                  </Link>
                )}

                {status === "REJECTED" && (
                  <div className="space-y-4">
                    <Button 
                      className="btn-premium w-full py-7" 
                      loading={requesting} 
                      onClick={handleRequest}
                    >
                      Request New Review
                    </Button>
                    <Link href="/support" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
                      Need assistance? Speak with support
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/[0.02] border-t border-white/5 p-4 flex justify-between items-center px-8">
               <span className="text-[10px] text-muted-foreground/50 uppercase tracking-tighter">Verified by Elite Shield™</span>
               <span className="text-[10px] text-muted-foreground/50">
                 {lastUpdatedAt ? `Sync: ${lastUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : "Syncing..."}
               </span>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <footer className="mt-10 text-center">
         <p className="text-[11px] text-muted-foreground/40 max-w-xs mx-auto leading-relaxed">
           Your data is encrypted end-to-end. Video sessions are conducted for security purposes only and are never shared with other members.
         </p>
      </footer>
    </div>
  );
}
