"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, type LucideIcon } from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function StaffPanelShell(props: {
  title: string;
  subtitle: string;
  name: string;
  navItems: NavItem[];
  onLogout: () => void | Promise<void>;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex w-full h-[100dvh] bg-[#0a0c10] text-[#f4f4f5] overflow-hidden">
      <aside className="w-72 shrink-0 border-r border-[#1f222b] bg-[#0a0c10]/70 backdrop-blur-md flex flex-col z-20">
        <div className="p-8 pb-12">
          <h1 className="font-serif text-2xl tracking-widest text-white uppercase">{props.title}</h1>
          <p className="text-[10px] text-[#C89B90] tracking-[0.2em] mt-1 uppercase">{props.subtitle}</p>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-2">
          {props.navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-3 rounded-lg flex items-center gap-4 transition-colors ${
                  isActive
                    ? "text-[#C89B90] bg-[#C89B90]/10 border border-[#C89B90]/20"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[#1f222b] space-y-3">
          <div className="text-xs text-white/70">{props.name}</div>
          <button
            onClick={() => void props.onLogout()}
            className="w-full inline-flex justify-center items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-xs uppercase tracking-[0.16em] text-white/75"
            type="button"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 relative h-full overflow-hidden flex flex-col">
        <div className="relative z-10 flex-1 overflow-x-hidden overflow-y-auto">{props.children}</div>
      </main>
    </div>
  );
}
