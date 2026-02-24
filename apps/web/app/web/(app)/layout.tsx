"use client";

import React from "react"

import { AppShell } from "@/app/components/shells/AppShell";
import RouteGuard from "@/app/components/RouteGuard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireActive>
      <AppShell>{children}</AppShell>
    </RouteGuard>
  );
}
