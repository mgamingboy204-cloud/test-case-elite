"use client";

import {
  BriefcaseBusiness,
  ListTodo,
  ShieldAlert,
  UserRoundCheck,
  Video,
  Users,
} from "lucide-react";
import { ProtectedStaffLayout } from "@/components/staff/ProtectedStaffLayout";
import { EMPLOYEE_ROUTES } from "@/lib/employeeRoutes";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedStaffLayout
      scope="employee"
      title="Employee Panel"
      subtitle="Operations Execution"
      defaultName="Employee"
      loadingLabel="Loading employee workspace..."
      navItems={[
        { href: EMPLOYEE_ROUTES.home, label: "Work Summary", icon: BriefcaseBusiness },
        { href: EMPLOYEE_ROUTES.assigned, label: "My Cases", icon: ListTodo },
        { href: EMPLOYEE_ROUTES.verification, label: "Verification Desk", icon: Video },
        { href: EMPLOYEE_ROUTES.matches, label: "Match Desk", icon: Users },
        { href: EMPLOYEE_ROUTES.incidents, label: "Incident Desk", icon: ShieldAlert },
        { href: EMPLOYEE_ROUTES.members, label: "My Members", icon: UserRoundCheck },
      ]}
    >
      {children}
    </ProtectedStaffLayout>
  );
}
