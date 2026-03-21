"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ActivitySquare, FileText, LayoutDashboard, ShieldAlert, ShieldCheck, Users, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { routeForAuthenticatedUser } from "@/lib/onboarding";
import { STAFF_ROUTES } from "@/lib/staffRoutes";
import { StaffPanelShell } from "@/components/staff/StaffPanelShell";
import { ADMIN_ROUTES } from "@/lib/adminRoutes";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthResolved, isAuthenticated, user, logout } = useAuth();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.displayName ||
    "Admin";

  useEffect(() => {
    if (!isAuthResolved) return;

    if (!isAuthenticated || !user) {
      router.replace(STAFF_ROUTES.login);
      return;
    }

    if (user.role !== "ADMIN") {
      router.replace(routeForAuthenticatedUser(user));
      return;
    }

    if (user.mustResetPassword) {
      router.replace(STAFF_ROUTES.passwordReset);
    }
  }, [isAuthResolved, isAuthenticated, router, user]);

  if (!isAuthResolved) {
    return <div className="min-h-screen bg-[#0a0c10] text-white/70 flex items-center justify-center">Loading admin workspace...</div>;
  }

  if (!isAuthenticated || !user || user.role !== "ADMIN") {
    return <div className="min-h-screen bg-[#0a0c10]" />;
  }

  if (user.mustResetPassword) {
    return <div className="min-h-screen bg-[#0a0c10]" />;
  }

  return (
    <StaffPanelShell
      title="Admin Panel"
      subtitle="Oversight & Control"
      name={name}
      onLogout={() => void logout()}
      navItems={[
        { href: ADMIN_ROUTES.home, label: "Overview", icon: LayoutDashboard },
        { href: ADMIN_ROUTES.members, label: "Members", icon: Users },
        { href: ADMIN_ROUTES.staff, label: "Staff", icon: ShieldCheck },
        { href: ADMIN_ROUTES.verification, label: "Verification", icon: Video },
        { href: ADMIN_ROUTES.matches, label: "Matches", icon: ActivitySquare },
        { href: ADMIN_ROUTES.escalations, label: "Escalations", icon: ShieldAlert },
        { href: ADMIN_ROUTES.audit, label: "Audit Logs", icon: FileText }
      ]}
    >
      {children}
    </StaffPanelShell>
  );
}
