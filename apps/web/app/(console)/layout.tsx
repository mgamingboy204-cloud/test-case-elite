"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Video, LogOut, Shield } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiRequestAuth } from "@/lib/api";

type MePayload = { role: "USER" | "EMPLOYEE" | "ADMIN"; isAdmin?: boolean; firstName?: string | null; lastName?: string | null; displayName?: string | null };

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("Employee");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const me = await apiRequestAuth<MePayload>("/me");
        if (me.role !== "EMPLOYEE" && me.role !== "ADMIN") {
          throw new Error("forbidden");
        }
        const hasAdminAccess = me.role === "ADMIN" || me.isAdmin === true;
        setIsAdmin(hasAdminAccess);
        if (pathname === "/admin" && !hasAdminAccess) {
          router.replace("/verify");
          return;
        }
        setName([me.firstName, me.lastName].filter(Boolean).join(" ") || me.displayName || "Employee");
      } catch {
        router.replace("/console/signin");
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [pathname, router]);

  const navItems = useMemo(
    () => [
      { label: "Video Verification", icon: Video, href: "/verify" },
      { label: "Match Handler", icon: Users, href: "/agent" },
      ...(isAdmin ? [{ label: "Founder Dashboard", icon: Shield, href: "/admin" }] : [])
    ],
    [isAdmin]
  );

  if (loading) {
    return <div className="min-h-screen bg-[#0a0c10] text-white/70 flex items-center justify-center">Loading employee workspace…</div>;
  }

  return (
    <div className="flex w-full app-height bg-[#0a0c10] text-[#f4f4f5] overflow-hidden">
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
              <Link key={item.href} href={item.href} className={`px-4 py-3 rounded-lg flex items-center gap-4 transition-colors ${isActive ? "text-[#C89B90] bg-[#C89B90]/10 border border-[#C89B90]/20" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                <Icon size={18} />
                <span className="text-sm font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[#1f222b] space-y-3">
          <div className="text-xs text-white/70">{name}</div>
          <button
            onClick={async () => {
              try { await apiRequestAuth<{ ok: true }>("/auth/logout", { method: "POST" }); } catch {}
              router.replace("/console/signin");
            }}
            className="w-full inline-flex justify-center items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white/75"
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
