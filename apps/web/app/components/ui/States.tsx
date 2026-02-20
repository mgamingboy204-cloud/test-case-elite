"use client";

import React from "react";
import { motion } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Button } from "./Button";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ── Luxury Empty State ── */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  style?: React.CSSProperties;
}

export function EmptyState({ icon, title, description, action, className, style }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center p-16 bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] rounded-[3.5rem]",
        className
      )}
      style={style}
    >
      {icon && (
        <motion.div
          animate={{
            y: [0, -12, 0],
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="text-7xl text-primary/30 mb-8 drop-shadow-sm font-serif italic"
        >
          {icon}
        </motion.div>
      )}
      <h3 className="text-3xl font-serif text-foreground/80 italic mb-4 tracking-tight">{title}</h3>
      {description && (
        <p className="text-muted-foreground/60 text-[13px] max-w-sm mx-auto leading-relaxed mb-10 italic">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="premium"
          onClick={action.onClick}
          className="px-10 py-6 rounded-2xl text-[10px] uppercase tracking-[0.3em] font-black"
        >
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

/* ── Luxury Error State ── */
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function ErrorState({
  message = "A momentary disruption in the collective's orchestration.",
  onRetry,
  className,
  style,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center text-center p-16 bg-white/60 backdrop-blur-2xl border border-red-100 shadow-[0_20px_40px_-10px_rgba(239,68,68,0.05)] rounded-[3.5rem]",
        className
      )}
      style={style}
    >
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-3xl font-serif italic mb-8 border border-red-100 shadow-sm relative overflow-hidden">
        <motion.div
          animate={{ opacity: [0, 0.2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 bg-red-400"
        />
        <span className="relative z-10">!</span>
      </div>
      <h3 className="text-3xl font-serif text-foreground/80 italic mb-4 tracking-tight">Technical Disruption</h3>
      <p className="text-muted-foreground/60 text-[13px] mb-10 italic max-w-xs mx-auto leading-relaxed">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          onClick={onRetry}
          className="px-10 py-6 rounded-2xl text-[10px] uppercase tracking-[0.3em] font-black border-red-200 text-red-600 hover:bg-red-50"
        >
          Re-Synchronize
        </Button>
      )}
    </motion.div>
  );
}
