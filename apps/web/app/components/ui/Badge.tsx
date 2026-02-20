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
  default: "bg-black/5 text-muted-foreground border-black/5",
  primary: "bg-primary/10 text-[#c47685] border-primary/20",
  success: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  warning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

export function Badge({ children, variant = "default", className, style }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300",
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
          ? "bg-primary text-white border-primary shadow-[0_4px_15px_rgba(232,165,178,0.4)]"
          : "bg-white/60 text-muted-foreground border-black/[0.05] hover:bg-white hover:border-black/10 shadow-sm",
        className
      )}
    >
      {label}
    </motion.button>
  );
}
