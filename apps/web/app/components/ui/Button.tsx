"use client";

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
    background: "linear-gradient(135deg, var(--primary), var(--primary-hover))",
    color: "var(--ctaText)",
    border: "1px solid color-mix(in srgb, var(--rose-200) 26%, transparent)",
    boxShadow: "var(--shadow-sm)",
  },
  secondary: {
    background: "color-mix(in srgb, var(--surface2) 88%, transparent)",
    color: "var(--text)",
    border: "1px solid var(--border)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid transparent",
  },
  danger: {
    background: "var(--danger)",
    color: "var(--ctaText)",
    border: "1px solid color-mix(in srgb, var(--danger) 46%, var(--border))",
  },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: "10px 14px", fontSize: 13, borderRadius: "14px", minHeight: 42 },
  md: { padding: "12px 20px", fontSize: 15, borderRadius: "15px", minHeight: 46 },
  lg: { padding: "14px 28px", fontSize: 16, borderRadius: "16px", minHeight: 50 },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading = false, fullWidth = false, disabled, style, children, ...props }, ref) => {
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
          opacity: disabled || loading ? 0.55 : 1,
          transition: "transform 180ms ease, opacity 160ms ease, box-shadow 180ms ease, background-color 180ms ease",
          width: fullWidth ? "100%" : undefined,
          whiteSpace: "nowrap",
          ...variantStyles[variant],
          ...sizeStyles[size],
          ...style,
        }}
        onPointerEnter={(e) => {
          if (!disabled && !loading && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            e.currentTarget.style.transform = "translateY(-1px)";
          }
        }}
        onPointerDown={(e) => {
          if (!disabled && !loading && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            e.currentTarget.style.transform = "scale(0.98)";
          }
        }}
        onPointerUp={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
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
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M14 8a6 6 0 00-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
