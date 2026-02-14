"use client";

import React from "react";

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
    background: "linear-gradient(130deg, var(--accent), color-mix(in oklab, var(--accent) 72%, #2d241d))",
    color: "var(--bg)",
    border: "1px solid color-mix(in oklab, var(--accent) 64%, transparent)",
    boxShadow: "0 10px 22px color-mix(in oklab, var(--accent) 28%, transparent)",
  },
  secondary: {
    background: "var(--surface)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text)",
    border: "1px solid var(--border)",
  },
  danger: {
    background: "var(--danger)",
    color: "#fff",
    border: "1px solid color-mix(in oklab, var(--danger) 64%, transparent)",
    boxShadow: "0 10px 20px color-mix(in oklab, var(--danger) 30%, transparent)",
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { height: 40, padding: "0 16px", fontSize: 13, borderRadius: "var(--radius-md)" },
  md: { height: 44, padding: "0 20px", fontSize: 15, borderRadius: "var(--radius-md)" },
  lg: { height: 48, padding: "0 28px", fontSize: 16, borderRadius: "var(--radius-lg)" },
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
          fontWeight: 620,
          cursor: disabled || loading ? "not-allowed" : "pointer",
          opacity: disabled || loading ? 0.56 : 1,
          transition: "transform 160ms ease, opacity 160ms ease, box-shadow 180ms ease, filter 180ms ease",
          width: fullWidth ? "100%" : undefined,
          whiteSpace: "nowrap",
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        }}
        onPointerDown={(e) => {
          if (!disabled && !loading) {
            const button = e.currentTarget as HTMLButtonElement;
            button.style.transform = "translateY(1px)";
            button.style.filter = "saturate(1.05)";
          }
        }}
        onPointerUp={(e) => {
          const button = e.currentTarget as HTMLButtonElement;
          button.style.transform = "translateY(0)";
          button.style.filter = "none";
        }}
        onPointerLeave={(e) => {
          const button = e.currentTarget as HTMLButtonElement;
          button.style.transform = "translateY(0)";
          button.style.filter = "none";
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
