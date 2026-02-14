"use client";

import React from "react"

import { AdminShell } from "@/app/components/shells/AdminShell";
import RouteGuard from "@/app/components/RouteGuard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAdmin requireActive>
      <AdminShell>{children}</AdminShell>
    </RouteGuard>
  );
}
