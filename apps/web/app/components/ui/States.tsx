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
        "flex flex-col items-center justify-center text-center p-12 glass-card rounded-[2.5rem]",
        className
      )}
      style={style}
    >
      {icon && (
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl text-primary/40 mb-6"
        >
          {icon}
        </motion.div>
      )}
      <h3 className="text-2xl font-serif text-foreground mb-3">{title}</h3>
      {description && (
        <p className="text-muted-foreground text-sm max-w-xs mx-auto leading-relaxed mb-8">
          {description}
        </p>
      )}
      {action && (
        <Button variant="premium" onClick={action.onClick}>
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
  message = "A momentary lapse in elite service.",
  onRetry,
  className,
  style,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex flex-col items-center justify-center text-center p-12 bg-destructive/5 border border-destructive/10 rounded-[2.5rem]",
        className
      )}
      style={style}
    >
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-2xl font-bold mb-6">
        !
      </div>
      <h3 className="text-2xl font-serif text-foreground mb-2">Oops!</h3>
      <p className="text-muted-foreground text-sm mb-8">{message}</p>
      {onRetry && (
        <Button variant="danger" onClick={onRetry} size="md">
          Attempt Reconnection
        </Button>
      )}
    </motion.div>
  );
}
