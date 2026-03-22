"use client";

import {
  ActivitySquare,
  FileText,
  LayoutDashboard,
  ShieldAlert,
  ShieldCheck,
  Users,
  Video,
} from "lucide-react";
import { ProtectedStaffLayout } from "@/components/staff/ProtectedStaffLayout";
import { ADMIN_ROUTES } from "@/lib/adminRoutes";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedStaffLayout
      scope="admin"
      title="Admin Panel"
      subtitle="Oversight & Control"
      defaultName="Admin"
      loadingLabel="Loading admin workspace..."
      navItems={[
        { href: ADMIN_ROUTES.home, label: "Overview", icon: LayoutDashboard },
        { href: ADMIN_ROUTES.members, label: "Members", icon: Users },
        { href: ADMIN_ROUTES.staff, label: "Staff", icon: ShieldCheck },
        { href: ADMIN_ROUTES.verification, label: "Verification", icon: Video },
        { href: ADMIN_ROUTES.matches, label: "Matches", icon: ActivitySquare },
        { href: ADMIN_ROUTES.escalations, label: "Escalations", icon: ShieldAlert },
        { href: ADMIN_ROUTES.audit, label: "Audit Logs", icon: FileText },
      ]}
    >
      {children}
    </ProtectedStaffLayout>
  );
}
