"use client";

import React from "react"

import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: "var(--primary)",
    color: "#fff",
    border: "none",
  },
  secondary: {
    background: "var(--panel)",
    color: "var(--text)",
    border: "1px solid var(--border)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text)",
    border: "none",
  },
  danger: {
    background: "var(--danger)",
    color: "#fff",
    border: "none",
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: "10px 14px", fontSize: 13, borderRadius: "var(--radius-sm)", minHeight: 44 },
  md: { padding: "12px 20px", fontSize: 16, borderRadius: "var(--radius-md)", minHeight: 44 },
  lg: { padding: "14px 28px", fontSize: 16, borderRadius: "var(--radius-lg)", minHeight: 48 },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      style,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontWeight: 600,
          cursor: disabled || loading ? "not-allowed" : "pointer",
          opacity: disabled || loading ? 0.5 : 1,
          transition: "transform 220ms ease-in-out, opacity 180ms ease-in-out, box-shadow 220ms ease-in-out",
          width: fullWidth ? "100%" : undefined,
          whiteSpace: "nowrap",
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        }}
        onPointerDown={(e) => {
          if (!disabled && !loading) {
            (e.currentTarget as HTMLButtonElement).style.opacity = "0.92";
          }
          if (!disabled && !loading) {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
          }
        }}
        onPointerUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        }}
        onPointerLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
        }}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path
        d="M14 8a6 6 0 00-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
