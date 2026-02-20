"use client";

import type { ReactNode } from "react";
import { Button } from "./Button";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
};

export default function EmptyState({ icon, title, message, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div className={`empty-state ${className || ""}`.trim()}>
      {icon ? <div className="empty-state__icon">{icon}</div> : null}
      <h3>{title}</h3>
      <p className="text-muted">{message}</p>
      {actionLabel ? (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
