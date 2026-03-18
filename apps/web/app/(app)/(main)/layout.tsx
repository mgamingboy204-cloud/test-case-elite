"use client";

import { AppShell } from "@/components/ui/app-shell";
import { OfflineIndicator } from "@/components/pwa/offline-indicator";
import { ScrollChromeProvider, useScrollChromeController } from "@/components/ui/scroll-chrome";
import { useAuth } from "@/contexts/AuthContext";
import { primeCache } from "@/lib/cache";
import { fetchIncomingLikes } from "@/lib/likes";
import { resolveRouteRedirect } from "@/lib/navigationGuard";
import { getQueryClient } from "@/lib/queryClient";
import { fetchAlerts, fetchDiscoverFeedPage, fetchMatches, fetchProfile, mapLegacyFeedItemToCard } from "@/lib/queries";
import { motion } from "framer-motion";
import { Bell, Compass, Heart, LogOut, Sparkles, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const NAV_ITEMS = [
  { href: "/discover", icon: Compass, label: "Discover" },
  { href: "/likes", icon: Heart, label: "Likes" },
  { href: "/matches", icon: Sparkles, label: "Matches" },
  { href: "/alerts", icon: Bell, label: "Alerts" },
  { href: "/profile", icon: User, label: "Profile" }
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScrollChromeProvider>
      <AppLayoutShell>{children}</AppLayoutShell>
    </ScrollChromeProvider>
  );
}

function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthResolved, onboardingStep, logout, appStateCode, appStateRedirectTo } = useAuth();
  const { chromeHidden, registerScrollElement } = useScrollChromeController();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted] = useState(() => typeof window !== "undefined");
  const prefetchedRef = useRef(false);
  const mainScrollRef = useRef<HTMLElement | null>(null);

  const prefetchRouteBundle = useCallback((href: string) => {
    router.prefetch(href);
    const queryClient = getQueryClient();

    if (href === "/likes") void queryClient.prefetchQuery({ queryKey: ["likes-incoming"], queryFn: fetchIncomingLikes }).then(() => {
      const data = queryClient.getQueryData(["likes-incoming"]);
      if (data) primeCache("likes-incoming", data);
    }).catch(() => null);

    if (href === "/matches") void queryClient.prefetchQuery({ queryKey: ["matches"], queryFn: fetchMatches }).then(() => {
      const data = queryClient.getQueryData(["matches"]);
      if (data) primeCache("matches", data);
    }).catch(() => null);

    if (href === "/alerts") void queryClient.prefetchQuery({ queryKey: ["alerts"], queryFn: fetchAlerts }).then(() => {
      const data = queryClient.getQueryData(["alerts"]);
      if (data) primeCache("alerts", data);
    }).catch(() => null);

    if (href === "/profile") void queryClient.prefetchQuery({ queryKey: ["profile"], queryFn: fetchProfile }).then(() => {
      const data = queryClient.getQueryData(["profile"]);
      if (data) primeCache("profile", data);
    }).catch(() => null);

    if (href === "/discover") {
      void queryClient.prefetchQuery({ queryKey: ["discover-feed", "bootstrap"], queryFn: () => fetchDiscoverFeedPage(undefined, 10) }).then(() => {
        const feed = queryClient.getQueryData<{ items: unknown[] }>(["discover-feed", "bootstrap"]);
        const cards = feed?.items?.map((item) => mapLegacyFeedItemToCard(item as never)) ?? [];
        cards.slice(0, 3).forEach((card) => {
          const imageUrl = (card as { imageUrl?: string | null }).imageUrl;
          if (!imageUrl || typeof window === "undefined") return;
          const img = new Image();
          img.src = imageUrl;
        });
      }).catch(() => null);
    }
  }, [router]);

  useEffect(() => {
    if (prefetchedRef.current) return;
    prefetchedRef.current = true;
    NAV_ITEMS.forEach((item) => prefetchRouteBundle(item.href));
  }, [prefetchRouteBundle]);

  useEffect(() => {
    registerScrollElement(mainScrollRef.current);
  }, [pathname, registerScrollElement]);

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
    <AppShell
      chromeHidden={chromeHidden}
      scrollRef={(element) => {
        mainScrollRef.current = element;
      }}
      sidebar={
        <aside className="hidden h-full w-[80px] flex-none flex-col border-r border-border/10 bg-background xl:w-[240px] min-[769px]:flex">
          <div className="flex h-[72px] flex-none items-center border-b border-primary/10 px-6 xl:px-8">
            <span className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-xl font-serif uppercase tracking-[0.5em] text-transparent">
              E<span className="hidden xl:inline">lite</span>
            </span>
          </div>

          <nav className="flex flex-1 flex-col gap-1 px-3 pt-6 xl:px-4">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  onMouseEnter={() => prefetchRouteBundle(href)}
                  onFocus={() => prefetchRouteBundle(href)}
                  className={`group relative flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-all duration-300 ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/40 hover:bg-foreground/5 hover:text-foreground/70"
                    }`}
                >
                  {isActive ? (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_8px_var(--color-primary)]"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  ) : null}
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={isActive ? "drop-shadow-[0_0_8px_rgba(200,155,144,0.5)]" : ""}
                  />
                  <span className={`hidden text-[12px] font-medium tracking-wide transition-opacity xl:block ${isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"}`}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="flex-none px-3 pb-8 xl:px-4">
            <button
              onClick={logout}
              className="flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-foreground/25 transition-all hover:bg-foreground/5 hover:text-foreground/60"
            >
              <LogOut size={20} strokeWidth={1.5} />
              <span className="hidden text-[12px] font-medium tracking-wide xl:block">Sign out</span>
            </button>
          </div>
        </aside>
      }
      header={
        <>
          <OfflineIndicator />
          <header
            className={`ios-app-header pointer-events-none border-b border-border/10 bg-background/80 backdrop-blur-xl transition-transform transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] min-[769px]:pointer-events-auto ${chromeHidden ? "-translate-y-[calc(100%+var(--safe-area-top))] opacity-0 min-[769px]:translate-y-0 min-[769px]:opacity-100" : "translate-y-0 opacity-100"}`}
            style={{ paddingTop: "var(--safe-area-top)", willChange: "transform, opacity" }}
          >
            <div className="ios-safe-x flex h-[56px] items-center justify-between px-6 min-[769px]:h-[72px]">
              <span className="bg-gradient-to-r from-primary to-highlight bg-clip-text text-xl font-serif tracking-widest text-transparent min-[769px]:hidden">
                VAEL
              </span>
              <span className="hidden text-[11px] font-medium uppercase tracking-[0.4em] text-foreground/40 min-[769px]:block">
                {NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "VAEL"}
              </span>

              <Link href="/profile" aria-label="Open profile and account settings" className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-foreground/5">
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
        </>
      }
      bottomNav={
        <nav
          className={`ios-app-bottom-nav border-t border-white/5 bg-background/95 text-foreground backdrop-blur-2xl transition-transform transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${chromeHidden ? "translate-y-[calc(100%+var(--safe-area-bottom))] opacity-0" : "translate-y-0 opacity-100"}`}
          style={{ paddingBottom: "var(--safe-area-bottom)", willChange: "transform, opacity" }}
          aria-hidden={chromeHidden}
        >
          <div className="ios-safe-x pointer-events-auto flex h-[58px] items-center justify-around px-2">
            {NAV_ITEMS.map(({ href, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch
                  onMouseEnter={() => prefetchRouteBundle(href)}
                  onFocus={() => prefetchRouteBundle(href)}
                  className={`flex h-full w-full items-center justify-center transition-colors ${isActive ? "text-primary" : "text-foreground/40 hover:text-foreground/70"}`}
                >
                  <Icon size={26} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "drop-shadow-[0_0_8px_rgba(200,155,144,0.4)]" : ""} />
                </Link>
              );
            })}
          </div>
        </nav>
      }
      contentInnerClassName="min-h-full w-full min-[769px]:mx-auto min-[769px]:max-w-[480px]"
    >
      {children}
    </AppShell>
  );
}
