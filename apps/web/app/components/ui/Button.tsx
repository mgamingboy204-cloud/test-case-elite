"use client";

import React, { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Utility for clean class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Variant = "primary" | "secondary" | "ghost" | "danger" | "premium";
type Size = "sm" | "md" | "lg" | "xl";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary: "bg-primary text-primary-foreground hover:shadow-[0_0_20px_rgba(232,165,178,0.4)]",
  secondary: "bg-secondary text-secondary-foreground border border-black/5 hover:bg-secondary/70",
  ghost: "bg-transparent text-foreground hover:bg-black/5",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  premium: "premium-gradient text-white shadow-xl hover:shadow-primary/40",
};

const sizes = {
  sm: "h-9 px-4 text-xs rounded-full",
  md: "h-11 px-6 text-sm rounded-full",
  lg: "h-14 px-8 text-base rounded-full",
  xl: "h-16 px-10 text-lg font-serif tracking-wide rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref as any}
        whileHover={!disabled && !loading ? { scale: 1.02, y: -1 } : {}}
        whileTap={!disabled && !loading ? { scale: 0.98, y: 0 } : {}}
        disabled={disabled || loading}
        className={cn(
          "relative inline-flex items-center justify-center gap-3 font-semibold transition-all duration-300 active:duration-75 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden",
          variants[variant],
          sizes[size],
          fullWidth ? "w-full" : "w-auto",
          className
        )}
        {...props}
      >
        {/* Subtle Shine Effect for Premium/Primary */}
        {(variant === "premium" || variant === "primary") && (
          <motion.div
            className="absolute inset-0 w-full h-full"
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
            }}
          />
        )}

        {loading ? (
          <div className="flex items-center gap-2">
            <Spinner />
            <span className="opacity-70">Processing...</span>
          </div>
        ) : (
          <span className="relative z-10 flex items-center gap-2">{children}</span>
        )}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

function Spinner() {
  return (
    <svg
      className="animate-spin h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}
