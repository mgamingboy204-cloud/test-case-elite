"use client";

import React, { type TextareaHTMLAttributes, forwardRef, useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
      <div className={cn("flex w-full flex-col gap-2", className)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "ml-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
              isFocused ? "text-primary" : "text-muted-foreground",
              error && "text-destructive",
            )}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            "input-premium min-h-[120px] resize-none py-3",
            error && "border-destructive/40 focus:ring-destructive/10",
          )}
          {...props}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-destructive">{error}</span>
          {charCount && (
            <span className={cn("text-xs text-muted-foreground", charCount.current > charCount.max && "text-destructive")}>
              {charCount.current}/{charCount.max}
            </span>
          )}
        </div>
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
