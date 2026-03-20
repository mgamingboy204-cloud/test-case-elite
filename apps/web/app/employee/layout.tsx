"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { EMPLOYEE_ROUTES } from "@/lib/employeeRoutes";
import { routeForAuthenticatedUser } from "@/lib/onboarding";
import { LogOut, Shield, UserRoundCheck, Users, Video } from "lucide-react";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthResolved, isAuthenticated, user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN" || Boolean(user?.isAdmin);
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.displayName || "Employee";

  useEffect(() => {
    if (!isAuthResolved) return;

    if (!isAuthenticated || !user) {
      router.replace(EMPLOYEE_ROUTES.login);
      return;
    }

    if (user.role !== "EMPLOYEE" && user.role !== "ADMIN") {
      router.replace(routeForAuthenticatedUser(user));
      return;
    }

    if (pathname === EMPLOYEE_ROUTES.admin && !isAdmin) {
      router.replace(EMPLOYEE_ROUTES.verification);
      return;
    }
  }, [isAdmin, isAuthenticated, isAuthResolved, pathname, router, user]);

  const navItems = [
    { href: EMPLOYEE_ROUTES.verification, label: "Verification Queue", icon: Video },
    { href: EMPLOYEE_ROUTES.matches, label: "Match Coordination", icon: Users },
    { href: EMPLOYEE_ROUTES.members, label: "My Members", icon: UserRoundCheck },
    ...(isAdmin ? [{ href: EMPLOYEE_ROUTES.admin, label: "Founder Dashboard", icon: Shield }] : [])
  ];

  if (!isAuthResolved) {
    return <div className="min-h-screen bg-[#0a0c10] text-white/70 flex items-center justify-center">Loading employee workspace...</div>;
  }

  if (!isAuthenticated || !user || (user.role !== "EMPLOYEE" && user.role !== "ADMIN")) {
    return <div className="min-h-screen bg-[#0a0c10]" />;
  }

  if (pathname === EMPLOYEE_ROUTES.admin && !isAdmin) {
    return <div className="min-h-screen bg-[#0a0c10]" />;
  }

  return (
    <div className="flex w-full h-[100dvh] bg-[#0a0c10] text-[#f4f4f5] overflow-hidden">
      <aside className="w-64 shrink-0 border-r border-[#1f222b] bg-[#0a0c10]/70 backdrop-blur-md flex flex-col z-20">
        <div className="p-8 pb-12">
          <h1 className="font-serif text-2xl tracking-widest text-white uppercase">Employee Panel</h1>
          <p className="text-[10px] text-[#C89B90] tracking-[0.2em] mt-1 uppercase">Private Operations</p>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 rounded-lg flex items-center gap-4 transition-colors ${isActive ? "text-[#C89B90] bg-[#C89B90]/10 border border-[#C89B90]/20" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[#1f222b] space-y-3">
          <div className="text-xs text-white/70">{name}</div>
          <button
            onClick={() => void logout()}
            className="w-full inline-flex justify-center items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white/75"
            type="button"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 relative h-full overflow-hidden flex flex-col">
        <div className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
