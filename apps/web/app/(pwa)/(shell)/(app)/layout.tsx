"use client";

import React from "react"

import { AppShell } from "@/components/pwa/AppShell";
import RouteGuard from "@/components/shared/RouteGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireActive>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
