"use client";

import { useAuth } from "@/contexts/AuthContext";
import { StaffPanelShell, type StaffNavItem } from "@/components/staff/StaffPanelShell";
import { useStaffRouteGate } from "@/lib/useStaffRouteGate";
import type { StaffRouteScope } from "@/lib/staffNavigation";

export function ProtectedStaffLayout(props: {
  scope: Extract<StaffRouteScope, "employee" | "admin">;
  title: string;
  subtitle: string;
  defaultName: string;
  loadingLabel: string;
  navItems: StaffNavItem[];
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const { isLoading, isReady, staffUser } = useStaffRouteGate(props.scope);

  const name =
    [staffUser?.firstName, staffUser?.lastName].filter(Boolean).join(" ") ||
    staffUser?.displayName ||
    props.defaultName;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-white/70 flex items-center justify-center">
        {props.loadingLabel}
      </div>
    );
  }

  if (!isReady || !staffUser) {
    return <div className="min-h-screen bg-[#0a0c10]" />;
  }

  return (
    <StaffPanelShell
      title={props.title}
      subtitle={props.subtitle}
      name={name}
      navItems={props.navItems}
      onLogout={() => void logout()}
    >
      {props.children}
    </StaffPanelShell>
  );
}
