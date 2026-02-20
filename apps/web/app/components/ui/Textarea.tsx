"use client";

import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  charCount?: { current: number; max: number };
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, charCount, id, style, className, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={className} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          style={{
            width: "100%",
            padding: "12px 16px",
            fontSize: 15,
            borderRadius: "var(--radius-md)",
            border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
            background: "var(--panel)",
            color: "var(--text)",
            outline: "none",
            resize: "vertical",
            minHeight: 100,
            transition: "border-color 200ms ease",
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--primary)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--border)";
          }}
          {...props}
        />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {error && <span style={{ fontSize: 13, color: "var(--danger)" }}>{error}</span>}
          {charCount && (
            <span
              style={{
                fontSize: 12,
                color: charCount.current > charCount.max ? "var(--danger)" : "var(--muted)",
                marginLeft: "auto",
              }}
            >
              {charCount.current}/{charCount.max}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
