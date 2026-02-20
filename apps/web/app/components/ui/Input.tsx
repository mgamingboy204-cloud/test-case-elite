"use client";

import React, { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperClassName?: string;
  wrapperStyle?: React.CSSProperties;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, wrapperClassName, wrapperStyle, className, style, id, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <motion.div
        className={cn("flex flex-col gap-2 w-full", wrapperClassName)}
        style={wrapperStyle}
        animate={error ? { x: [0, -4, 4, -4, 4, 0] } : {}}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-500 ml-1",
              isFocused ? "text-primary" : "text-muted-foreground",
              error && "text-destructive"
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={style}
            className={cn(
              "w-full h-14 px-5 bg-white/60 border border-black/[0.05] rounded-2xl text-base placeholder:text-muted-foreground/40 outline-none transition-all duration-500 shadow-sm",
              "focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/5 shadow-inner",
              error && "border-destructive/30 focus:border-destructive/50 focus:ring-destructive/5",
              className
            )}
            {...props}
          />

          {/* Animated focus underline for extra premier feel */}
          <motion.div
            className="absolute bottom-0 left-5 right-5 h-[1.5px] bg-primary rounded-full"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: isFocused ? 1 : 0, opacity: isFocused ? 0.8 : 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.span
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1.5 ml-1"
            >
              <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center text-[10px]">!</span> {error}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

Input.displayName = "Input";
