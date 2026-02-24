"use client";

import type { ReactNode } from "react";
import RouteGuard from "@/components/shared/RouteGuard";
import { AppShell } from "@/components/pwa/AppShell";

export default function PwaShell({ children, requireActive = true }: { children: ReactNode; requireActive?: boolean }) {
  if (!requireActive) return <>{children}</>;
  return (
    <RouteGuard requireActive>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
