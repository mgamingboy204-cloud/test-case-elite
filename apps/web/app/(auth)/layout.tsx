"use client";

import React from "react";
import { motion } from "framer-motion";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#faf8f6]">
      {/* Cinematic Ambient Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft Rose Gold Glows for Cinematic Depth */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 40, 0],
            y: [0, -20, 0],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -top-[10%] -left-[10%] w-[80%] h-[80%] rounded-full bg-primary/[0.08] blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            x: [0, -30, 0],
            y: [0, 30, 0],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-[15%] -right-[15%] w-[70%] h-[70%] rounded-full bg-primary/[0.12] blur-[120px]"
        />

        {/* Dynamic Pearl White Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(250,248,246,0.4)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#faf8f6]/40 via-transparent to-[#faf8f6]/60" />
      </div>

      {/* Cinematic Grain Texture for Micro-Aesthetic */}
      <div className="absolute inset-0 z-1 opacity-[0.02] pointer-events-none mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <motion.main
        initial={{ opacity: 0, scale: 0.99, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full flex justify-center py-12"
      >
        <div className="w-full max-w-7xl px-6">
          {children}
        </div>
      </motion.main>
    </div>
  );
}
