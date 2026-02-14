"use client";

import type { CSSProperties, ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "primary" | "success" | "danger" | "warning";
  style?: CSSProperties;
}

const variantMap: Record<NonNullable<BadgeProps["variant"]>, CSSProperties> = {
  default: { background: "color-mix(in oklab, var(--surface-2) 72%, transparent)", color: "var(--text)", border: "1px solid var(--border)" },
  primary: { background: "var(--primary-light)", color: "var(--primary)", border: "1px solid color-mix(in oklab, var(--primary) 36%, transparent)" },
  success: { background: "var(--success-light)", color: "var(--success)", border: "1px solid color-mix(in oklab, var(--success) 36%, transparent)" },
  danger: { background: "var(--danger-light)", color: "var(--danger)", border: "1px solid color-mix(in oklab, var(--danger) 36%, transparent)" },
  warning: { background: "var(--warning-light)", color: "var(--warning)", border: "1px solid color-mix(in oklab, var(--warning) 36%, transparent)" },
};

export function Badge({ children, variant = "default", style }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        fontSize: 12,
        fontWeight: 620,
        borderRadius: "var(--radius-full)",
        whiteSpace: "nowrap",
        ...variantMap[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Chip({ label, selected = false, onClick, style }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 16px",
        fontSize: 14,
        fontWeight: 540,
        borderRadius: "var(--radius-full)",
        border: selected ? "1px solid var(--primary)" : "1px solid var(--border)",
        background: selected ? "var(--primary-light)" : "var(--surface)",
        color: selected ? "var(--primary)" : "var(--text)",
        cursor: "pointer",
        transition: "all 150ms ease",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {label}
    </button>
  );
}
