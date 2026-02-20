"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/app/components/ui/Card";
import { Button } from "@/app/components/ui/Button";
import { Badge } from "@/app/components/ui/Badge";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { ErrorState } from "@/app/components/ui/States";
import { useToast } from "@/app/providers";
import { apiFetch } from "@/lib/api";
import { getDefaultRoute } from "@/lib/onboarding";
import { useSession } from "@/lib/session";

type VStatus = "NOT_REQUESTED" | "REQUESTED" | "IN_PROGRESS" | "COMPLETED" | "APPROVED" | "REJECTED";

interface StatusMeta {
  label: string;
  icon: string;
  desc: string;
  variant: "primary" | "warning" | "success" | "danger";
  technicalCode: string;
}

const statusConfig: Record<VStatus, StatusMeta> = {
  NOT_REQUESTED: { 
    label: "Identity Initialization", 
    icon: "👤", 
    desc: "A brief video session is required to maintain our circle's prestige. Our verification concierge will securely validate your identity.",
    variant: "primary",
    technicalCode: "AUTH_INIT_REQUIRED"
  },
  REQUESTED: { 
    label: "In Priority Queue", 
    icon: "📡", 
    desc: "Your identity signal has been received. A dedicated verifier is currently prioritizing your terminal for final authorization.",
    variant: "warning",
    technicalCode: "SIGNAL_QUEUED_P1"
  },
  IN_PROGRESS: { 
    label: "Active Verification", 
    icon: "📡", 
    desc: "Secure link established. Your verification concierge is now reviewing your identity. Please do not sever this connection.",
    variant: "primary",
    technicalCode: "LINK_ESTABLISHED_SECURE"
  },
  COMPLETED: { 
    label: "Identity Confirmed", 
    icon: "✨", 
    desc: "Signal verified. Your profile has been granted Elite status. Redirecting to your secure onboarding dashboard.",
    variant: "success",
    technicalCode: "ID_HASH_CONFIRMED"
  },
  APPROVED: { 
    label: "Identity Confirmed", 
    icon: "✨", 
    desc: "Signal verified. Your profile has been granted Elite status. Redirecting to your secure onboarding dashboard.",
    variant: "success",
    technicalCode: "ID_HASH_CONFIRMED"
  },
  REJECTED: { 
    label: "Identity Conflict", 
    icon: "❗", 
    desc: "We detected a conflict in your identity submission. Lighting or document clarity may be the cause. Please re-initiate.",
    variant: "danger",
    technicalCode: "AUTH_FAILED_RETRY"
  }
};

export default function VideoVerificationPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const { refresh } = useSession();
  const [status, setStatus] = useState<VStatus>("NOT_REQUESTED");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [syncTime, setSyncTime] = useState<string>("");

  const isVerified = status === "COMPLETED" || status === "APPROVED";

  const fetchStatus = async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const data = await apiFetch<{ status: VStatus }>("/me/verification-status");
      setStatus(data.status ?? "NOT_REQUESTED");
      setSyncTime(new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      const refreshedUser = await refresh();
      if (refreshedUser) {
        const nextRoute = getDefaultRoute(refreshedUser);
        // Using includes to handle optional trailing slashes
        if (!nextRoute.includes("video-verification")) {
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
      addToast("Priority Signal Dispatched.", "success");
    } catch (err: any) {
      addToast(err.message || "Dispatch failure.", "error");
    } finally {
      setRequesting(false);
    }
  };

  const config = useMemo(() => statusConfig[status], [status]);

  if (loading) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-8 pt-20 px-6">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-64 rounded-full" />
          <Skeleton className="h-4 w-48 rounded-full" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-[3.5rem]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-xl mx-auto pt-32 px-6">
        <ErrorState message="Our identity network is currently out of sync." onRetry={() => fetchStatus(true)} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-6 pt-12 pb-32">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 space-y-4"
      >
        <h1 className="text-5xl font-serif premium-text-gradient tracking-tight italic">Concierge Desk</h1>
        <p className="text-muted-foreground font-light tracking-widest uppercase text-[10px]">
          Identity Guard System v4.2 // Encryption: ACTIVE
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass-card !p-0 overflow-hidden border-white/10 shadow-[0_64px_128px_-32px_rgba(0,0,0,0.9)] rounded-[3.5rem]">
            {/* Identity Scanner Visualizer */}
            <div className="relative h-[280px] w-full overflow-hidden bg-black/40 flex items-center justify-center border-b border-white/5">
               {/* Grid Background */}
               <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:40px_40px]" />
               
               {/* Pulsing Scan Ring */}
               <motion.div 
                 animate={{ 
                   scale: [1, 1.25, 1],
                   opacity: [0.3, 0.7, 0.3],
                   rotate: 360
                 }}
                 transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                 className="absolute w-56 h-56 border-[1px] border-primary/30 rounded-full border-dashed"
               />
               <motion.div 
                 animate={{ 
                   scale: [1.15, 0.85, 1.15],
                   opacity: [0.2, 0.5, 0.2]
                 }}
                 transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute w-48 h-48 border-[4px] border-primary/10 rounded-full"
               />

               {/* Central Identity Icon */}
               <div className="relative z-10 text-7xl drop-shadow-[0_0_30px_rgba(212,175,55,0.5)]">
                 {config.icon}
               </div>

               {/* Scan Line Animation */}
               <motion.div 
                 animate={{ top: ["0%", "100%", "0%"] }}
                 transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                 className="absolute left-0 right-0 h-[2px] bg-primary/40 z-20 shadow-[0_0_20px_rgba(212,175,55,0.9)]"
               />
            </div>

            <div className="p-12 md:p-20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-12">
                <div className="space-y-3">
                  <h2 className="text-4xl font-serif text-foreground">{config.label}</h2>
                  <div className="flex items-center gap-3">
                    <div className="flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-primary font-bold">Terminal Sync: Active</span>
                  </div>
                </div>
                <Badge variant={config.variant} className="px-8 py-3 rounded-full text-xs tracking-[0.2em] bg-white/5 border-white/10 font-bold">
                  {config.technicalCode}
                </Badge>
              </div>

              <p className="text-muted-foreground font-light leading-relaxed text-xl mb-16 max-w-2xl italic">
                "{config.desc}"
              </p>

              <div className="space-y-8">
                {status === "NOT_REQUESTED" && (
                  <Button 
                    variant="premium" 
                    size="xl" 
                    fullWidth 
                    loading={requesting} 
                    onClick={handleRequest}
                    className="shadow-2xl h-24 text-xl"
                  >
                    Establish Secure Session
                  </Button>
                )}

                {(status === "REQUESTED" || status === "IN_PROGRESS") && (
                  <div className="space-y-12">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         animate={{ x: ["-100%", "100%"] }}
                         transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                         className="h-full w-1/3 premium-gradient shadow-[0_0_20px_rgba(212,175,55,0.6)]"
                       />
                    </div>
                    <div className="flex justify-between items-center px-4">
                       <span className="text-[10px] text-muted-foreground uppercase tracking-[0.5em]">Optimizing connection...</span>
                       <span className="text-[10px] text-primary uppercase tracking-[0.5em] font-bold">MIL-SPEC Encryption</span>
                    </div>
                  </div>
                )}

                {isVerified && (
                  <Link href="/onboarding/payment">
                    <Button variant="premium" size="xl" fullWidth className="h-24 shadow-2xl text-xl">
                      Access Membership Vault
                    </Button>
                  </Link>
                )}

                {status === "REJECTED" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Button 
                      variant="premium" 
                      size="lg" 
                      loading={requesting} 
                      onClick={handleRequest}
                      className="h-20"
                    >
                      Re-Initialize Scan
                    </Button>
                    <Button variant="secondary" size="lg" className="h-20 border-white/5">
                      <Link href="/support">Speak with Concierge</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Footer Rail */}
            <div className="bg-black/60 border-t border-white/5 p-8 flex flex-col md:flex-row justify-between items-center px-16 gap-6">
               <div className="flex items-center gap-8">
                 <span className="text-[10px] text-muted-foreground/40 uppercase tracking-widest font-mono">Elite Shield v2.0.4</span>
                 <div className="h-4 w-[1px] bg-white/10" />
                 <span className="text-[10px] text-primary/60 font-mono tracking-tighter">STATUS_CODE: {config.technicalCode}</span>
               </div>
               <div className="flex items-center gap-6">
                 <span className="text-[10px] text-muted-foreground/40 font-mono uppercase tracking-widest">LAST_SYNC: {syncTime}</span>
                 <motion.div 
                   animate={{ opacity: [0.2, 1, 0.2] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.7)]"
                 />
               </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <footer className="mt-20 text-center">
         <p className="text-[10px] text-muted-foreground/30 max-w-xl mx-auto leading-relaxed uppercase tracking-[0.3em]">
           Warning: All sessions are end-to-end encrypted and logged for audit. Identity spoofing is grounds for permanent network exclusion.
         </p>
      </footer>
    </div>
  );
}
