"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const tabs = [
  {
    href: "/discover",
    label: "Discover",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-500 ${active ? "text-primary" : "text-muted-foreground/50"}`}>
        <circle cx="12" cy="12" r="10" />
        <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
      </svg>
    ),
  },
  {
    href: "/likes",
    label: "Likes",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-500 ${active ? "text-primary" : "text-muted-foreground/50"}`}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: "/matches",
    label: "Matches",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-500 ${active ? "text-primary" : "text-muted-foreground/50"}`}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" className={`transition-all duration-500 ${active ? "text-primary" : "text-muted-foreground/50"}`}>
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
      {/* Glassmorphic base */}
      <div className="absolute inset-0 bg-white/60 backdrop-blur-3xl border-t border-white/70 shadow-[0_-12px_40px_-16px_rgba(0,0,0,0.06)]" />

      <nav className="relative flex justify-around items-center h-[72px] px-2 max-w-lg mx-auto" aria-label="Main navigation">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center justify-center gap-1 group flex-1 h-full outline-none"
              aria-current={active ? "page" : undefined}
            >
              {/* Active pill background */}
              {active && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute inset-x-2 top-2 bottom-2 rounded-2xl bg-primary/[0.08] border border-primary/10"
                  transition={{ type: "spring", stiffness: 500, damping: 45 }}
                />
              )}

              {/* Icon + label */}
              <div className="relative z-10 flex flex-col items-center gap-1 py-1">
                <motion.div
                  animate={{ scale: active ? 1.1 : 1, y: active ? -1 : 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {tab.icon(active)}
                </motion.div>

                <AnimatePresence mode="wait">
                  <motion.span
                    key={active ? "active" : "inactive"}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: active ? 1 : 0.4, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.3 }}
                    className={`text-[9px] uppercase tracking-[0.2em] font-black transition-all duration-300 ${active ? "text-primary" : "text-muted-foreground/40"}`}
                  >
                    {tab.label}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Active glow dot */}
              {active && (
                <motion.div
                  layoutId="bottom-nav-glow"
                  className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_rgba(232,165,178,1)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Thin aesthetic line */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/10 to-transparent mx-8" />
    </div>
  );
}
