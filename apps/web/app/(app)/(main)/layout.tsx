"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Compass, Heart, Bell, User, Sparkles, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/likes", icon: Heart, label: "Likes" },
  { href: "/matches", icon: Sparkles, label: "Matches" },
  { href: "/alerts", icon: Bell, label: "Alerts" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, logout } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !isAuthenticated) return null;

  return (
    <div className="flex flex-row h-[100vh] w-screen bg-background transition-colors duration-500 overflow-hidden mobile-container desktop-container">

      {/* ═══════════════════════════════════════════════════════════════════
          DESKTOP SIDEBAR 
      ═══════════════════════════════════════════════════════════════════ */}
      <aside className="hidden min-[769px]:flex flex-col w-[80px] xl:w-[240px] h-full flex-none bg-background border-r border-border/10 z-50">
        <div className="h-[72px] flex items-center px-6 xl:px-8 flex-none border-b border-primary/10">
          <span className="text-xl font-serif tracking-[0.5em] uppercase bg-clip-text text-transparent bg-gradient-to-br from-primary via-primary/80 to-primary/60">
            E<span className="hidden xl:inline">lite</span>
          </span>
        </div>

        <nav className="flex-1 flex flex-col gap-1 px-3 xl:px-4 pt-6">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative flex items-center gap-4 px-3 py-3.5 rounded-2xl transition-all duration-300 group ${isActive
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-primary rounded-r-full shadow-[0_0_8px_var(--color-primary)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className={isActive ? "drop-shadow-[0_0_8px_rgba(200,155,144,0.5)]" : ""}
                />
                <span className={`hidden xl:block text-[12px] font-medium tracking-wide transition-opacity ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
                  }`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex-none px-3 xl:px-4 pb-8">
          <button
            onClick={logout}
            className="flex items-center gap-4 w-full px-3 py-3 rounded-2xl text-foreground/25 hover:text-foreground/60 hover:bg-foreground/5 transition-all"
          >
            <LogOut size={20} strokeWidth={1.5} />
            <span className="hidden xl:block text-[12px] font-medium tracking-wide">Sign out</span>
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT COLUMN 
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar */}
        <header
          className="flex-none w-full z-40 bg-background/80 backdrop-blur-xl border-b border-border/10"
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="flex items-center justify-between px-6 h-[56px] min-[769px]:h-[72px]">
            <span className="min-[769px]:hidden text-xl font-serif tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-primary to-highlight">
              ELITE
            </span>
            <span className="hidden min-[769px]:block text-[11px] uppercase tracking-[0.4em] text-foreground/40 font-medium">
              {NAV_ITEMS.find(n => n.href === pathname)?.label ?? 'Elite'}
            </span>

            <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-foreground/5 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <main
          className="flex-1 overflow-y-auto overflow-x-hidden relative no-scrollbar bg-background"
          style={{ WebkitOverflowScrolling: "touch", overscrollBehaviorY: "contain" }}
        >
          <div className="w-full h-full min-[769px]:max-w-[480px] min-[769px]:mx-auto">
            {children}
          </div>
        </main>

        {/* ═══════════════════════════════════════════════════════════════════
            MOBILE BOTTOM NAV (Exact Instagram Proportions)
        ═══════════════════════════════════════════════════════════════════ */}
        <nav 
          className="flex-none min-[769px]:hidden w-full bg-background/95 backdrop-blur-2xl border-t border-white/5 z-50 text-foreground"
          /* We MUST apply the safe area padding here so the black background covers the home bar entirely */
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          {/* Exact 48px height used by Instagram/Apple native tab bars */}
          <div className="flex h-[48px] items-center justify-around px-2">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  /* Uses gap-1 for tight spacing, removed margins to ensure mathematically perfect vertical centering */
                  className={`flex flex-col items-center justify-center w-full h-full gap-[2px] transition-colors ${
                    isActive ? "text-primary" : "text-foreground/40 hover:text-foreground/70"
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "drop-shadow-[0_0_8px_rgba(200,155,144,0.4)]" : ""} />
                  {/* Kept text size tiny so it fits perfectly in the 48px space alongside the icon */}
                  <span className="text-[9px] font-medium tracking-wide">{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
