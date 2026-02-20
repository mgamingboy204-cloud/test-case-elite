"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const tabs = [
  {
    href: "/discover",
    label: "Discover",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-primary transition-all duration-500 scale-110" : "text-muted-foreground/60 transition-all duration-300"}>
        <circle cx="12" cy="12" r="10" />
        <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
      </svg>
    ),
  },
  {
    href: "/likes",
    label: "Likes",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-primary transition-all duration-500 scale-110" : "text-muted-foreground/60 transition-all duration-300"}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: "/matches",
    label: "Matches",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-primary transition-all duration-500 scale-110" : "text-muted-foreground/60 transition-all duration-300"}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={active ? "text-primary transition-all duration-500 scale-110" : "text-muted-foreground/60 transition-all duration-300"}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] pb-[env(safe-area-inset-bottom,0px)]">
      {/* Cinematic Glass Base */}
      <div className="absolute inset-0 bg-white/40 backdrop-blur-2xl border-t border-white/60 shadow-[0_-8px_32px_-12px_rgba(0,0,0,0.05)]" />

      <nav className="relative flex justify-around items-center h-16 px-4 max-w-lg mx-auto" aria-label="Main navigation">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center justify-center gap-1 group flex-1 h-full outline-none"
              aria-current={active ? "page" : undefined}
            >
              <div className="relative z-10 flex flex-col items-center">
                {tab.icon(active)}
                <span className={`text-[10px] uppercase tracking-[0.1em] font-bold mt-1.5 transition-all duration-300 ${active ? "text-primary opacity-100" : "text-muted-foreground/40 opacity-0 group-hover:opacity-100"}`}>
                  {tab.label}
                </span>
              </div>

              {/* Active Indicator Dash */}
              {active && (
                <motion.div
                  layoutId="bottom-nav-active"
                  className="absolute bottom-2 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(232,165,178,0.8)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Aesthetic Spacer for layout */}
      <div className="h-[2px] bg-muted/5 w-1/4 mx-auto mb-1 rounded-full opacity-20" />
    </div>
  );
}
