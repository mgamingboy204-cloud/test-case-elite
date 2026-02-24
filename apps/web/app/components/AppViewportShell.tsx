"use client";

import type { ReactNode } from "react";

type AppViewportShellProps = {
  children: ReactNode;
  className?: string;
};

export default function AppViewportShell({ children, className }: AppViewportShellProps) {
  return <div className={className ? `app-viewport-shell ${className}` : "app-viewport-shell"}>{children}</div>;
}
