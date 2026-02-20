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

export function Skeleton({ className, width, height, radius, borderRadius }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white/5 rounded-2xl",
        className
      )}
      style={{ width, height, borderRadius: radius || borderRadius }}
    >
      {/* Cinematic Shimmer Effect */}
      <motion.div
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
        }}
      />
      
      {/* Breathing Pulse */}
      <motion.div
        animate={{
          opacity: [0.5, 1, 0.5],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="w-full h-full bg-white/5"
      />
    </div>
  );
}
