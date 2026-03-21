"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, ListTodo, ShieldAlert, UserRoundCheck, Video, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { EMPLOYEE_ROUTES } from "@/lib/employeeRoutes";
import { routeForAuthenticatedUser } from "@/lib/onboarding";
import { STAFF_ROUTES } from "@/lib/staffRoutes";
import { StaffPanelShell } from "@/components/staff/StaffPanelShell";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthResolved, isAuthenticated, user, logout } = useAuth();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.displayName ||
    "Employee";

  useEffect(() => {
    if (!isAuthResolved) return;

    if (!isAuthenticated || !user) {
      router.replace(STAFF_ROUTES.login);
      return;
    }

    if (user.role !== "EMPLOYEE") {
      router.replace(routeForAuthenticatedUser(user));
      return;
    }

    if (user.mustResetPassword) {
      router.replace(STAFF_ROUTES.passwordReset);
    }
  }, [isAuthResolved, isAuthenticated, router, user]);

  if (!isAuthResolved) {
    return <div className="min-h-screen bg-[#0a0c10] text-white/70 flex items-center justify-center">Loading employee workspace...</div>;
  }

  if (!isAuthenticated || !user || user.role !== "EMPLOYEE") {
    return <div className="min-h-screen bg-[#0a0c10]" />;
  }

  if (user.mustResetPassword) {
    return <div className="min-h-screen bg-[#0a0c10]" />;
  }

  return (
    <StaffPanelShell
      title="Employee Panel"
      subtitle="Operations Execution"
      name={name}
      onLogout={() => void logout()}
      navItems={[
        { href: EMPLOYEE_ROUTES.home, label: "Work Summary", icon: BriefcaseBusiness },
        { href: EMPLOYEE_ROUTES.assigned, label: "My Cases", icon: ListTodo },
        { href: EMPLOYEE_ROUTES.verification, label: "Verification Desk", icon: Video },
        { href: EMPLOYEE_ROUTES.matches, label: "Match Desk", icon: Users },
        { href: EMPLOYEE_ROUTES.incidents, label: "Incident Desk", icon: ShieldAlert },
        { href: EMPLOYEE_ROUTES.members, label: "My Members", icon: UserRoundCheck }
      ]}
    >
      {children}
    </StaffPanelShell>
  );
}
