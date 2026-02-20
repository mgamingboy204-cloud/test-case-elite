"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { BottomNav } from "@/app/components/BottomNav";
import type { ReactNode } from "react";
import SidebarNavItem from "../ui/SidebarNavItem";

const sidebarLinks = [
  { href: "/discover", label: "The Discovery", icon: "✦" },
  { href: "/likes", label: "Curated Likes", icon: "♥" },
  { href: "/matches", label: "Matches", icon: "✉" },
  { href: "/profile", label: "Your Identity", icon: "◎" },
  { href: "/settings", label: "Vault Settings", icon: "⚙" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#faf8f6] flex flex-col font-sans selection:bg-primary/20 overflow-x-hidden">
      {/* Cinematic Header */}
      <header className="h-20 bg-white/40 backdrop-blur-3xl border-b border-white/60 flex items-center justify-between px-8 sticky top-0 z-[60] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.02)]">
        <Link href="/discover" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-all duration-500">
            <span className="text-primary font-serif italic text-xl">E</span>
          </div>
          <span className="text-2xl font-serif tracking-tighter text-foreground/90 group-hover:text-primary transition-colors duration-500">
            Elite Match
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-primary/5 rounded-full border border-primary/10">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-primary/60">Encrypted Liaison Environment</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex relative">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-80 bg-white/20 border-r border-white/40 flex-col gap-2 p-8 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto">
          <div className="mb-10 px-4">
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/30">Liaison Navigation</p>
          </div>

          <nav className="space-y-2">
            {sidebarLinks.map((link) => {
              const active = pathname.startsWith(link.href);
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
            <div className="relative p-6 rounded-[2rem] bg-primary/5 overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-700 group-hover:scale-150" />
              <p className="relative z-10 text-[10px] uppercase tracking-widest font-bold text-primary/60 mb-2">Concierge Support</p>
              <p className="relative z-10 text-[11px] text-muted-foreground/60 leading-relaxed font-medium">
                Encountering an anomaly? Our handlers are on standby for your request.
              </p>
            </div>
          </div>
        </aside>

        {/* Content area */}
        <main className="flex-1 min-w-0 flex flex-col items-center">
          <div className="w-full max-w-5xl px-8 py-12 md:py-20 pb-32 md:pb-20 min-h-[calc(100vh-80px)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav Spacer */}
      <div className="md:hidden h-24" />

      {/* Mobile bottom nav */}
      <div className="md:hidden">
        <BottomNav />
      </div>

      {/* Global Background Artifacts */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#faf8f6]">
        <div className="absolute top-[10%] left-[5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] opacity-60 animate-pulse" />
        <div className="absolute bottom-[10%] right-[5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] opacity-60 animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
    </div>
  );
}

