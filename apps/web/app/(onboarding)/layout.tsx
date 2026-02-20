"use client";

import React from "react"
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import RouteGuard from "@/app/components/RouteGuard";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#faf8f6] selection:bg-primary/20">
      {/* Cinematic Header */}
      <header className="h-20 bg-white/40 backdrop-blur-2xl border-b border-white/60 flex items-center justify-between px-8 sticky top-0 z-[60] shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all duration-500">
            <span className="text-primary font-serif italic text-xl">E</span>
          </div>
          <span className="text-2xl font-serif tracking-tighter text-foreground/90 group-hover:text-primary transition-colors duration-500">
            Elite Match
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground/30">
            Secure Curation
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-12 md:py-20">
        <RouteGuard allowedOnboardingSteps={["PHONE_VERIFIED", "VIDEO_VERIFICATION_PENDING", "VIDEO_VERIFIED", "PAYMENT_PENDING", "PAID", "PROFILE_PENDING"]}>
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="app-content">{children}</div>
            </motion.div>
          </AnimatePresence>
        </RouteGuard>
      </main>

      {/* Aesthetic Accents */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#faf8f6]">
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] opacity-40" />
        <div className="absolute bottom-[20%] left-[10%] w-[30%] h-[30%] bg-primary/5 rounded-full blur-[100px] opacity-40" />
      </div>
    </div>
  );
}
