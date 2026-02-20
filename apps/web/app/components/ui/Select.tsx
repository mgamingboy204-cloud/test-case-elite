"use client";

import React, { forwardRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  wrapperClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, id, className, wrapperClassName, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : Math.random().toString(36).substring(7));

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    return (
      <motion.div
        className={cn("flex flex-col gap-2 w-full", wrapperClassName)}
        animate={error ? { x: [0, -4, 4, -4, 4, 0] } : {}}
        transition={{ duration: 0.4, ease: "easeInOut" }}
      >
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              "text-[10px] uppercase tracking-[0.2em] font-bold transition-colors duration-500 ml-1",
              isFocused ? "text-primary" : "text-muted-foreground",
              error && "text-destructive"
            )}
          >
            {label}
          </label>
        )}

        <div className="relative group">
          <select
            ref={ref}
            id={selectId}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={cn(
              "w-full h-14 px-5 bg-white/60 border border-black/[0.05] rounded-2xl text-base outline-none transition-all duration-500 shadow-sm appearance-none cursor-pointer",
              "focus:bg-white focus:border-primary/40 focus:ring-4 focus:ring-primary/5 shadow-inner",
              error && "border-destructive/30 focus:border-destructive/50 focus:ring-destructive/5",
              !props.value && "text-muted-foreground/40",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled hidden>
                {placeholder}
              </option>
            )}
            {options.map((o) => (
              <option key={o.value} value={o.value} className="text-foreground bg-white">
                {o.label}
              </option>
            ))}
          </select>

          {/* Custom Premium Chevron */}
          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/30 transition-transform duration-500 group-hover:text-primary/60">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn("transition-transform duration-500", isFocused && "rotate-180")}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Animated focus underline */}
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
              className="text-[11px] font-medium text-destructive mt-1 flex items-center gap-1.5 ml-1 italic"
            >
              <span className="w-4 h-4 rounded-full bg-red-50 flex items-center justify-center text-[10px] border border-red-100">!</span> {error}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

Select.displayName = "Select";
