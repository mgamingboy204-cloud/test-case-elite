"use client";

import React, { type TextareaHTMLAttributes, forwardRef, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { motion, AnimatePresence } from "framer-motion";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  charCount?: { current: number; max: number };
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, charCount, id, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={cn("flex flex-col gap-2 w-full", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-500 ml-1",
              isFocused ? "text-primary" : "text-muted-foreground",
              error ? "text-destructive" : ""
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "w-full px-5 py-4 bg-white/60 border border-black/[0.05] rounded-2xl text-base placeholder:text-muted-foreground/40 outline-none transition-all duration-500 shadow-sm min-h-[120px] resize-none",
              "focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/5 shadow-inner",
              error ? "border-destructive/30 focus:border-destructive/50" : ""
            )}
            {...props}
          />
        </div>
        <div className="flex justify-between items-center px-1">
          <AnimatePresence>
            {error && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[11px] font-medium text-destructive flex items-center gap-1.5"
              >
                <span className="w-4 h-4 rounded-full bg-destructive/10 flex items-center justify-center text-[10px]">!</span> {error}
              </motion.span>
            )}
          </AnimatePresence>
          {charCount && (
            <span
              className={cn(
                "text-[10px] font-medium transition-colors ml-auto tracking-wider",
                charCount.current > charCount.max ? "text-destructive" : "text-muted-foreground/60"
              )}
            >
              {charCount.current} / {charCount.max}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
