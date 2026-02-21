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
        background: "color-mix(in srgb, var(--panel) 86%, transparent)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow: "var(--shadow-md)",
        overflow: "hidden",
        transition: "box-shadow 220ms ease-in-out, transform 220ms ease-in-out",
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
    >
      {children}
    </div>
  );
}
