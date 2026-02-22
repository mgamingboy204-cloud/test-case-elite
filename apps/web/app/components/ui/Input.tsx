"use client";

import { type InputHTMLAttributes, forwardRef, type CSSProperties } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperStyle?: CSSProperties;
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  fontSize: 15,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "color-mix(in srgb, var(--surface2) 82%, transparent)",
  color: "var(--text)",
  outline: "none",
  transition: "border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, wrapperStyle, style, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, ...wrapperStyle }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.01em", color: "var(--text-secondary)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          style={{
            ...inputStyle,
            borderColor: error ? "var(--danger)" : undefined,
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--primary)";
            e.currentTarget.style.boxShadow = `0 0 0 3px ${error ? "var(--danger-light)" : "var(--ring)"}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
          {...props}
        />
        {error && (
          <span style={{ fontSize: 13, color: "var(--danger)" }}>{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
