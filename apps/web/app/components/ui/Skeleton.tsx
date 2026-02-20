"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ className, width, height, radius, borderRadius, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-black/[0.03] rounded-2xl",
        className
      )}
      style={{ width, height, borderRadius: radius || borderRadius, ...style }}
    >
      {/* Cinematic Rose Gold Shimmer */}
      <motion.div
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0 z-10"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(232,165,178,0.08), transparent)",
        }}
      />

      {/* Soft Breathing Ambient Pulse */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-full h-full bg-primary/5"
      />

      {/* Internal Premium Polish */}
      <div className="absolute inset-x-0 top-0 h-px bg-white/40 pointer-events-none" />
    </div>
  );
}

