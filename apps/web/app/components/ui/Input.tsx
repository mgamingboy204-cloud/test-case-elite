"use client";

import { type InputHTMLAttributes, forwardRef, type CSSProperties } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  wrapperStyle?: CSSProperties;
}

const inputStyle: CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 16px",
  fontSize: 15,
  borderRadius: "var(--radius-md)",
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  outline: "none",
  transition: "border-color 200ms ease, box-shadow 200ms ease, background 200ms ease",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, wrapperStyle, style, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6, ...wrapperStyle }}>
        {label && (
          <label
            htmlFor={inputId}
            style={{ fontSize: 13, fontWeight: 560, color: "var(--muted)" }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          style={{
            ...inputStyle,
            borderColor: error ? "color-mix(in oklab, var(--danger) 82%, var(--border))" : undefined,
            ...style,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--accent)";
            e.currentTarget.style.boxShadow = `0 0 0 4px ${error ? "var(--danger-light)" : "color-mix(in oklab, var(--accent) 18%, transparent)"}`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "color-mix(in oklab, var(--danger) 82%, var(--border))" : "var(--border)";
            e.currentTarget.style.boxShadow = "none";
          }}
          {...props}
        />
        {error && (
          <span style={{ fontSize: 12, color: "var(--danger)" }}>{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
