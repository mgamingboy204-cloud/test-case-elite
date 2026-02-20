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
              "text-xs uppercase tracking-[0.15em] font-bold transition-colors duration-300",
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
              "w-full h-14 px-5 bg-white/[0.03] border border-white/10 rounded-2xl text-base placeholder:text-muted-foreground/30 outline-none transition-all duration-500",
              "focus:bg-white/[0.05] focus:border-primary/50 focus:ring-4 focus:ring-primary/10",
              error && "border-destructive/50 focus:border-destructive focus:ring-destructive/10",
              className
            )}
            {...props}
          />
          
          {/* Animated focus underline for extra premier feel */}
          <motion.div
            className="absolute bottom-0 left-0 h-[2px] bg-primary"
            initial={{ width: "0%" }}
            animate={{ width: isFocused ? "100%" : "0%" }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          />
        </div>

        <AnimatePresence>
          {error && (
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xs font-medium text-destructive mt-1 flex items-center gap-1"
            >
              <span className="text-[14px]">!</span> {error}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }
);

Input.displayName = "Input";
