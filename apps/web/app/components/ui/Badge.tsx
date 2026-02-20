'use client';

import type { CSSProperties, ReactNode } from "react";

type BadgeVariant = "default" | "primary" | "success" | "danger" | "warning";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  style?: CSSProperties;
  className?: string;
}

const variantMap: Record<BadgeVariant, CSSProperties> = {
  default: { background: "var(--border)", color: "var(--text)" },
  primary: { background: "var(--primary-light)", color: "var(--primary)" },
  success: { background: "var(--success-light)", color: "var(--success)" },
  danger: { background: "var(--danger-light)", color: "var(--danger)" },
  warning: { background: "var(--warning-light)", color: "var(--warning)" },
};

export function Badge({ children, variant = "default", style, className }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
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

/* Chip - interactive badge */
interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}

export function Chip({ label, selected = false, onClick, style, className }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 16px",
        fontSize: 14,
        fontWeight: 500,
        borderRadius: "var(--radius-full)",
        border: selected ? "2px solid var(--primary)" : "1px solid var(--border)",
        background: selected ? "var(--primary-light)" : "var(--panel)",
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
