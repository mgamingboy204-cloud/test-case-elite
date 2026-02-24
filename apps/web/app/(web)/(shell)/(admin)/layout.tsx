"use client";

import React from "react"

import { AdminShell } from "@/components/web/AdminShell";
import RouteGuard from "@/components/shared/RouteGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAdmin requireActive>
      <AdminShell>{children}</AdminShell>
    </RouteGuard>
  );
}
