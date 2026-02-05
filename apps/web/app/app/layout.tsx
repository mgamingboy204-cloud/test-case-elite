"use client";

import RouteGuard from "../components/RouteGuard";
import AppShell from "../components/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireActive>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
