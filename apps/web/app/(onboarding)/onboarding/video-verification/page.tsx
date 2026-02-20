"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
    icon: "◎",
    desc: "A brief biometric session is required to maintain our circle's prestige. Our verification curators will securely validate your identity.",
    variant: "primary",
    technicalCode: "AUTH_INIT_REQUIRED"
  },
  REQUESTED: {
    label: "In Priority Queue",
    icon: "✦",
    desc: "Your identity signal has been received. A dedicated curator is currently prioritizing your terminal for final authorization.",
    variant: "warning",
    technicalCode: "SIGNAL_QUEUED_P1"
  },
  IN_PROGRESS: {
    label: "Active Verification",
    icon: "◈",
    desc: "Secure link established. Your verification concierge is now reviewing your identity. Please maintain this connection.",
    variant: "primary",
    technicalCode: "LINK_ESTABLISHED_SECURE"
  },
  COMPLETED: {
    label: "Identity Confirmed",
    icon: "✨",
    desc: "Signal verified. Your identity has been memorialized within the collective. Redirecting to your secure dashboard.",
    variant: "success",
    technicalCode: "ID_HASH_CONFIRMED"
  },
  APPROVED: {
    label: "Identity Confirmed",
    icon: "✨",
    desc: "Signal verified. Your identity has been memorialized within the collective. Redirecting to your secure dashboard.",
    variant: "success",
    technicalCode: "ID_HASH_CONFIRMED"
  },
  REJECTED: {
    label: "Identity Conflict",
    icon: "❗",
    desc: "We detected a discrepancy in your identity submission. Lighting or document clarity may be the cause. Please re-initiate.",
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

  const fetchStatus = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    try {
      const data = await apiFetch<{ status: VStatus }>("/me/verification-status");
      setStatus(data.status ?? "NOT_REQUESTED");
      setSyncTime(new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      const refreshedUser = await refresh();
      if (refreshedUser) {
        const nextRoute = getDefaultRoute(refreshedUser);
        if (!nextRoute.includes("video-verification")) {
          router.replace(nextRoute);
        }
      }
    } catch {
      if (initial) setError(true);
    } finally {
      if (initial) setLoading(false);
    }
  }, [router, refresh]);

  useEffect(() => {
    void fetchStatus(true);
  }, [fetchStatus]);

  useEffect(() => {
    if (isVerified) return;
    const timer = window.setInterval(() => {
      void fetchStatus(false);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [isVerified, fetchStatus]);

  const handleRequest = async () => {
    setRequesting(true);
    try {
      await apiFetch("/verification-requests", { method: "POST" });
      setStatus("REQUESTED");
      addToast("Identity signal successfully dispatched.", "success");
    } catch (err: any) {
      addToast(err.message || "Dispatch failure.", "error");
    } finally {
      setRequesting(false);
    }
  };

  const config = useMemo(() => statusConfig[status], [status]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto space-y-16 pt-24 px-6">
        <header className="space-y-6">
          <Skeleton className="h-16 w-80 rounded-2xl mx-auto md:mx-0" />
          <Skeleton className="h-4 w-64 rounded-lg mx-auto md:mx-0" />
        </header>
        <Skeleton className="h-[600px] w-full rounded-[4.5rem]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto pt-24 px-6">
        <ErrorState message="The identity network is momentarily out of sync." onRetry={() => fetchStatus(true)} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-16 pb-40 font-serif relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="mb-20 space-y-4 text-center md:text-left"
      >
        <h1 className="text-5xl md:text-6xl tracking-tight text-foreground/90 italic">Concierge Desk</h1>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.6em] font-black text-primary/40 italic font-sans">
            Identity Guard System v4.5 // Encryption Active
          </span>
          <div className="hidden md:block w-12 h-[1px] bg-primary/20" />
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="p-0 overflow-hidden bg-white/40 backdrop-blur-3xl border-white/60 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.1)] rounded-[4.5rem] group transition-all duration-1000">
            {/* Identity Scanner Visualizer */}
            <div className="relative h-[400px] w-full overflow-hidden bg-primary/[0.01] flex items-center justify-center border-b border-primary/5">
              {/* Pattern Background */}
              <div className="absolute inset-0 opacity-[0.05] bg-[radial-gradient(#e8a5b2_1.5px,transparent_1.5px)] bg-[size:32px_32px]" />

              {/* Pulsing Scan Rings with Depth */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.25, 0.1],
                  rotate: 360
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute w-[400px] h-[400px] border-[1px] border-primary/20 rounded-full border-dashed"
              />
              <motion.div
                animate={{
                  scale: [1.15, 0.95, 1.15],
                  opacity: [0.08, 0.2, 0.08],
                  rotate: -360
                }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute w-[350px] h-[350px] border-[0.5px] border-primary/10 rounded-full"
              />
              <motion.div
                animate={{
                  scale: [0.9, 1.1, 0.9],
                  opacity: [0.1, 0.3, 0.1]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute w-[300px] h-[300px] border-[6px] border-primary/[0.03] rounded-full"
              />

              {/* Central Identity Icon */}
              <div className="relative z-10 text-9xl flex items-center justify-center drop-shadow-2xl select-none group-hover:scale-110 transition-transform duration-1000">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] w-48 h-48 rounded-full mix-blend-overlay animate-pulse" />
                <span className="relative z-10 text-primary italic drop-shadow-[0_0_30px_rgba(232,165,178,0.4)] animate-in zoom-in duration-1000">{config.icon}</span>
              </div>

              {/* Scan Line Animation - Fixed Speed, Premium Glow */}
              <motion.div
                animate={{ top: ["-5%", "105%", "-5%"] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent z-20 shadow-[0_0_25px_rgba(232,165,178,0.6)]"
              />
            </div>

            <div className="p-16 md:p-20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-12 mb-16 border-b border-primary/5 pb-14">
                <div className="space-y-6">
                  <h2 className="text-5xl font-serif text-foreground/80 italic tracking-tight leading-none">{config.label}</h2>
                  <div className="flex items-center gap-4">
                    <div className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary/40 shadow-[0_0_10px_rgba(232,165,178,0.5)]"></span>
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.5em] text-primary/60 font-black font-sans">Link Stability: Optimizing</span>
                  </div>
                </div>
                <Badge className="px-10 py-4 rounded-full text-[10px] tracking-[0.4em] bg-primary/5 text-primary border-primary/10 font-black uppercase font-sans italic shadow-sm">
                  {config.technicalCode}
                </Badge>
              </div>

              <p className="text-muted-foreground/50 leading-relaxed text-2xl mb-20 max-w-2xl italic pr-12 border-l-2 border-primary/20 pl-8">
                &ldquo;{config.desc}&rdquo;
              </p>

              <div className="space-y-10 max-w-xl">
                {status === "NOT_REQUESTED" && (
                  <Button
                    variant="premium"
                    size="xl"
                    fullWidth
                    loading={requesting}
                    onClick={handleRequest}
                    className="py-8 rounded-[2.5rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.5em] font-black"
                  >
                    Establish Identification Session
                  </Button>
                )}

                {(status === "REQUESTED" || status === "IN_PROGRESS") && (
                  <div className="space-y-12">
                    <div className="h-2 w-full bg-primary/5 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "250%" }}
                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                        className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary/50 to-transparent absolute shadow-[0_0_15px_rgba(232,165,178,0.3)]"
                      />
                    </div>
                    <div className="flex justify-between items-center opacity-40">
                      <span className="text-[11px] text-muted-foreground uppercase tracking-[0.5em] font-black italic font-sans">Synchronizing...</span>
                      <span className="text-[11px] text-primary uppercase tracking-[0.5em] font-black font-sans">Encrypted Tunnel Alpha</span>
                    </div>
                  </div>
                )}

                {isVerified && (
                  <Link href="/onboarding/payment">
                    <Button variant="premium" size="xl" fullWidth className="py-8 rounded-[2.5rem] shadow-2xl shadow-primary/20 text-[10px] uppercase tracking-[0.5em] font-black">
                      Access Membership Vault
                    </Button>
                  </Link>
                )}

                {status === "REJECTED" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Button
                      variant="premium"
                      loading={requesting}
                      onClick={handleRequest}
                      className="py-7 rounded-[2rem] text-[10px] uppercase tracking-widest font-black"
                    >
                      Re-Initialize Scan
                    </Button>
                    <Link href="/settings" className="block w-full">
                      <Button variant="secondary" fullWidth className="py-7 rounded-[2rem] text-[10px] uppercase tracking-widest font-black">
                        Speak with Curator
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Technical Footer Rail */}
            <div className="bg-primary/[0.02] border-t border-primary/5 p-10 flex flex-col md:flex-row justify-between items-center px-16 gap-8">
              <div className="flex items-center gap-10">
                <span className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.4em] font-black font-mono">Elite Guard v2.5.0</span>
                <div className="h-4 w-[1px] bg-primary/10" />
                <span className="text-[10px] text-primary/40 font-black tracking-[0.4em] font-mono uppercase italic">ID_STATE: synchronous</span>
              </div>
              <div className="flex items-center gap-8">
                <span className="text-[10px] text-muted-foreground/30 font-black font-mono uppercase tracking-[0.4em]">LAST_SIGNAL: {syncTime || "PENDING"}</span>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.2, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-2.5 h-2.5 rounded-full bg-primary/40 shadow-[0_0_15px_rgba(232,165,178,0.6)]"
                />
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      <footer className="mt-24 text-center space-y-4 opacity-30">
        <div className="w-16 h-px bg-primary/40 mx-auto" />
        <p className="text-[10px] text-muted-foreground max-w-2xl mx-auto leading-relaxed uppercase tracking-[0.6em] font-black italic font-sans">
          End-to-End Encrypted Identity Session // Unauthorized access is strictly prohibited by terminal protocol.
        </p>
      </footer>
    </div>
  );
}
