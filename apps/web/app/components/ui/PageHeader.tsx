"use client";

import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  variant?: "default" | "marketing";
};

export default function PageHeader({ title, subtitle, actions, variant = "default" }: PageHeaderProps) {
  return (
    <div className={`page-header ${variant === "marketing" ? "marketing-page-header" : ""}`.trim()}>
      <div>
        <h1>{title}</h1>
        {subtitle ? <p className="text-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </div>
  );
}
