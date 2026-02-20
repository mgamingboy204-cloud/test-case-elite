"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";
import SidebarNavItem from "../ui/SidebarNavItem";

const adminLinks = [
  { href: "/admin", label: "Control Center", icon: "✦" },
  { href: "/admin/users", label: "Client Registry", icon: "◎" },
  { href: "/admin/video-verifications", label: "Identity Rituals", icon: "☑" },
  { href: "/admin/reports", label: "Infractions", icon: "！" },
  { href: "/admin/refunds", label: "Value Reversal", icon: "↺" },
  { href: "/admin/matches", label: "Fate Oversight", icon: "✉" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#faf8f6] flex flex-col font-sans selection:bg-primary/20 overflow-x-hidden">
      {/* Cinematic Header */}
      <header className="h-20 bg-white/40 backdrop-blur-2xl border-b border-white/60 flex items-center justify-between px-8 sticky top-0 z-[60] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.02)]">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all duration-500">
              <span className="text-primary font-serif italic text-xl">A</span>
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-2xl font-serif tracking-tighter text-foreground/90 group-hover:text-primary transition-colors duration-500">
                Elite Admin
              </span>
              <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary/40">Secure Node</span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-black text-primary/60">System Synchronized</span>
          </div>
          <Link
            href="/discover"
            className="px-6 py-2 bg-white/80 border border-black/5 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground hover:bg-primary hover:text-white hover:border-primary transition-all duration-500 shadow-sm"
          >
            Access Discovery
          </Link>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-80 bg-white/20 border-r border-white/40 flex-col gap-2 p-8 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto">
          <div className="mb-10 px-4">
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/30">Administrative Access</p>
          </div>

          <nav className="space-y-2">
            {adminLinks.map((link) => {
              const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
              return (
                <SidebarNavItem
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  icon={link.icon}
                  active={active}
                />
              );
            })}
          </nav>

          <div className="mt-auto pt-10 px-4">
            <div className="relative p-6 rounded-[2rem] bg-black/5 overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-700 group-hover:scale-150" />
              <p className="relative z-10 text-[10px] uppercase tracking-widest font-bold text-foreground/60 mb-2">Node Encryption</p>
              <p className="relative z-10 text-[11px] text-muted-foreground/40 leading-relaxed font-medium">
                End-to-end telemetry active. All actions reflect in the central manifest.
              </p>
            </div>
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 min-w-0 flex flex-col items-center">
          <div className="w-full max-w-7xl px-4 md:px-8 py-10 md:py-16 min-h-[calc(100vh-80px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="app-content">{children}</div>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Global Background Artifacts */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#faf8f6]">
        <div className="absolute top-[20%] left-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px] opacity-40 animate-pulse" />
        <div className="absolute bottom-[20%] right-[10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px] opacity-40 animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
    </div>
  );
}

