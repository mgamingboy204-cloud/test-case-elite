"use client";

import React from "react";
import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#faf8f6]">
      {/* ── Cinematic Ambient Background ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">

        {/* Orb 1 — top left, slow drift */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, -25, 0],
            opacity: [0.35, 0.55, 0.35],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[15%] -left-[10%] w-[75%] h-[75%] rounded-full bg-primary/[0.08] blur-[160px]"
        />

        {/* Orb 2 — bottom right, counter drift */}
        <motion.div
          animate={{
            scale: [1.1, 1, 1.15],
            x: [0, -35, 0],
            y: [0, 35, 0],
            opacity: [0.28, 0.48, 0.28],
          }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[18%] -right-[15%] w-[70%] h-[70%] rounded-full bg-primary/[0.12] blur-[130px]"
        />

        {/* Orb 3 — center accent, faster */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 20, -15, 0],
            y: [0, -15, 20, 0],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-[40%] left-[40%] w-[40%] h-[40%] rounded-full bg-primary/[0.06] blur-[120px]"
        />

        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(250,248,246,0.35)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#faf8f6]/30 via-transparent to-[#faf8f6]/50" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `linear-gradient(rgba(196, 118, 133, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(196, 118, 133, 0.8) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Cinematic grain texture */}
      <div className="absolute inset-0 z-[1] opacity-[0.025] pointer-events-none mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Content */}
      <motion.main
        initial={{ opacity: 0, scale: 0.99, filter: "blur(12px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full flex justify-center py-12"
      >
        <div className="w-full max-w-7xl px-6">
          <div className="app-content max-w-xl mx-auto">{children}</div>
        </div>
      </motion.main>
    </div>
  );
}
