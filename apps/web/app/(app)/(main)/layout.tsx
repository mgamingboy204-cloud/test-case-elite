"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Compass, Heart, Bell, User, Sparkles, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAlerts, fetchMatches, fetchProfile } from "@/lib/queries";
import { primeCache } from "@/lib/cache";
import { motion } from "framer-motion";
import { resolveRouteRedirect } from "@/lib/navigationGuard";
import { fetchIncomingLikes } from "@/lib/likes";

const NAV_ITEMS = [
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/likes", icon: Heart, label: "Likes" },
  { href: "/matches", icon: Sparkles, label: "Matches" },
  { href: "/alerts", icon: Bell, label: "Alerts" },
  { href: "/profile", icon: User, label: "Profile" }
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthResolved, onboardingStep, logout, appStateCode, appStateRedirectTo } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted] = useState(() => typeof window !== "undefined");
  const prefetchedRef = useRef(false);

  const prefetchRouteBundle = useCallback((href: string) => {
    router.prefetch(href);
    if (href === "/likes") void fetchIncomingLikes().then((data) => primeCache("likes-incoming", data)).catch(() => null);
    if (href === "/matches") void fetchMatches().then((data) => primeCache("matches", data)).catch(() => null);
    if (href === "/alerts") void fetchAlerts().then((data) => primeCache("alerts", data)).catch(() => null);
    if (href === "/profile") void fetchProfile().then((data) => primeCache("profile", data)).catch(() => null);
  }, [router]);


  useEffect(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    NAV_ITEMS.forEach((item) => prefetchRouteBundle(item.href));
  }, [prefetchRouteBundle]);

  useEffect(() => {
    const redirect = resolveRouteRedirect({
      pathname,
      isAuthenticated,
      isAuthResolved,
      onboardingStep,
      scope: "main",
      appStateCode,
      appStateRedirectTo
    });

    if (redirect && pathname !== redirect) {
      router.replace(redirect);
    }
  }, [isAuthResolved, isAuthenticated, onboardingStep, pathname, router, appStateCode, appStateRedirectTo]);

  if (!mounted || !isAuthResolved || !isAuthenticated || onboardingStep !== "COMPLETED") return null;

  return (
    <div className="flex flex-row h-[100dvh] w-screen bg-background transition-colors duration-500 overflow-hidden mobile-container desktop-container">

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
                prefetch
                onMouseEnter={() => prefetchRouteBundle(href)}
                onFocus={() => prefetchRouteBundle(href)}
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
              VAEL
            </span>
            <span className="hidden min-[769px]:block text-[11px] uppercase tracking-[0.4em] text-foreground/40 font-medium">
              {NAV_ITEMS.find(n => n.href === pathname)?.label ?? 'VAEL'}
            </span>

            <Link href="/profile" aria-label="Open profile and account settings" className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-foreground/5 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
            </Link>
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
            MOBILE BOTTOM NAV 
        ═══════════════════════════════════════════════════════════════════ */}
        {/* Absolutely zero padding here. Force pinned to the bottom. */}
        <nav className="flex-none min-[769px]:hidden w-full bg-background/95 backdrop-blur-2xl border-t border-white/5 z-50 text-foreground">
          
          {/* Exactly 50px tall, icons perfectly centered inside */}
          <div className="flex h-[50px] items-center justify-around px-2">
            {NAV_ITEMS.map(({ href, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  onMouseEnter={() => prefetchRouteBundle(href)}
                  onFocus={() => prefetchRouteBundle(href)}
                  className={`flex items-center justify-center w-full h-full transition-colors ${
                    isActive ? "text-primary" : "text-foreground/40 hover:text-foreground/70"
                  }`}
                >
                  {/* Icon bumped up to size 26, text span completely deleted */}
                  <Icon size={26} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "drop-shadow-[0_0_8px_rgba(200,155,144,0.4)]" : ""} />
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
