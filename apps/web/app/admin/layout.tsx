"use client";

import RouteGuard from "../components/RouteGuard";
import AppShellLayout from "../components/ui/AppShellLayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAdmin>
      <AppShellLayout>{children}</AppShellLayout>
    </RouteGuard>
  );
}
