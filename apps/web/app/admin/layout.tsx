"use client";

import RouteGuard from "../components/RouteGuard";
import AppShellLayout from "../components/ui/AppShellLayout";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard requireAdmin>
      <AppShellLayout rightPanel={<AdminSidebar />}>{children}</AppShellLayout>
    </RouteGuard>
  );
}
