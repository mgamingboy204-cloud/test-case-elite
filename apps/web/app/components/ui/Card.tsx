'use client';

import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, style, className, onClick }: CardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{
        background: "linear-gradient(150deg, color-mix(in srgb, var(--surface) 92%, transparent), color-mix(in srgb, var(--surface2) 96%, var(--pearl-panel)) )",
        borderRadius: "30px",
        border: "1px solid color-mix(in srgb, var(--border) 82%, var(--accent) 18%)",
        boxShadow: "var(--shadow-sm)",
        position: "relative",
        isolation: "isolate",
        overflow: "hidden",
        transition: "box-shadow 220ms ease, transform 220ms ease",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick();
            }
          : undefined
      }
      onPointerEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow = "var(--shadow-md)";
        }
      }}
      onPointerLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "var(--shadow-sm)";
        }
      }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", border: "1px solid color-mix(in srgb, var(--accent-light) 34%, transparent)", boxShadow: "inset 0 1px 0 color-mix(in srgb, var(--accent-light) 28%, transparent)", pointerEvents: "none" }} />
      {children}
    </div>
  );
}
