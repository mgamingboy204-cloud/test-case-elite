"use client";

import type { ReactNode, CSSProperties } from "react";
import { Button } from "./Button";

/* ── Empty State ── */
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  style?: CSSProperties;
  className?: string;
}

export function EmptyState({ icon, title, description, action, style, className }: EmptyStateProps) {
  return (
    <div
      className={`fade-in ${className || ""}`.trim()}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        gap: 16,
        ...style,
      }}
    >
      {icon && (
        <div style={{ fontSize: 48, color: "var(--muted)", lineHeight: 1 }}>{icon}</div>
      )}
      <h3 style={{ margin: 0, color: "var(--text)" }}>{title}</h3>
      {description && (
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 15, maxWidth: 320 }}>
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} size="sm" style={{ marginTop: 8 }}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

/* ── Error State ── */
interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  style?: CSSProperties;
  className?: string;
}

export function ErrorState({
  message = "Something went wrong",
  onRetry,
  style,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={`fade-in ${className || ""}`.trim()}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 24px",
        gap: 16,
        ...style,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--danger-light)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 24,
          color: "var(--danger)",
        }}
      >
        !
      </div>
      <h3 style={{ margin: 0, color: "var(--text)" }}>Oops!</h3>
      <p style={{ margin: 0, color: "var(--muted)", fontSize: 15 }}>{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}
