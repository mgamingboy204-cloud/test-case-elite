"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type BadgeVariant = "default" | "primary" | "success" | "danger" | "warning";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-white/5 text-muted-foreground border-white/10",
  primary: "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(212,175,55,0.1)]",
  success: "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]",
};

export function Badge({ children, variant = "default", className, style }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] transition-all duration-300",
        variantStyles[variant],
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

/* ── Luxury Interactive Chip ── */
interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Chip({ label, selected = false, onClick, className }: ChipProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center rounded-full border px-5 py-2 text-xs font-semibold transition-all duration-500",
        selected 
          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
          : "bg-white/5 text-muted-foreground border-white/10 hover:bg-white/10 hover:border-white/20",
        className
      )}
    >
      {label}
    </motion.button>
  );
}
