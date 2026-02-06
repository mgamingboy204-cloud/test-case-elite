"use client";

import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "muted" | "outline";
  children: ReactNode;
};

export default function Card({ variant = "default", className = "", children, ...props }: CardProps) {
  const classes = `ui-card ui-card--${variant}${className ? ` ${className}` : ""}`;
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
