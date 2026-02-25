"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/app/providers";
import { useSession } from "@/lib/session";
import { BottomSheet } from "@/app/components/ui/BottomSheet";
import { BottomNav } from "@/app/components/BottomNav";
import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bottomNavClassName?: string;
  variant?: "default" | "discover";
};

const sidebarLinks = [
  { href: "/discover", label: "Discover", icon: "✸" },
  { href: "/likes", label: "Likes", icon: "♥" },
  { href: "/matches", label: "Matches", icon: "☺" },
  { href: "/profile", label: "Profile", icon: "☻" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function AppShell({ children, className, headerClassName, bottomNavClassName, variant = "default" }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const { user } = useSession();
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  useEffect(() => {
    router.prefetch("/discover");
    router.prefetch("/matches");
    router.prefetch("/likes");
  }, [router]);

  const mobileTitle = useMemo(() => {
    if (pathname?.startsWith("/discover")) return "Discover";
    if (pathname?.startsWith("/likes")) return "Likes";
    if (pathname?.startsWith("/matches")) return "Matches";
    if (pathname?.startsWith("/profile")) return "Profile";
    return "Elite Match";
  }, [pathname]);

  const profileName = String(user?.displayName ?? user?.firstName ?? "").trim();

  return (
    <div className={`app-shell${className ? ` ${className}` : ""}`} data-variant={variant}>
      <header className={`app-header ${headerClassName ?? ""}`.trim()}>
        <Link href="/discover" className="app-header__brand">
          Elite Match
        </Link>
        <button
          onClick={toggle}
          className="app-header__theme-btn"
          aria-label="Toggle theme"
        >
          {theme === "light" ? "☾" : "☀"}
        </button>
      </header>

      <header className={`app-mobile-header ${headerClassName ?? ""}`.trim()} aria-label="Mobile header">
        <Link href="/profile" aria-label="Open profile" className="app-mobile-header__dot" title={profileName || "Profile"} />
        <div className="app-mobile-header__title" title={mobileTitle}>{mobileTitle}</div>
        <button
          className="app-mobile-header__filter-btn"
          onClick={() => {
            if (pathname?.startsWith("/discover")) {
              window.dispatchEvent(new CustomEvent("elite-open-discover-filters"));
              return;
            }
            setMobileSettingsOpen(true);
          }}
          aria-label={pathname?.startsWith("/discover") ? "Open discover filters" : "Open settings"}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="app-shell__body">
        <aside className="app-sidebar">
          {sidebarLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className="app-sidebar__link" data-active={active ? "true" : "false"}>
                <span className="app-sidebar__icon">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </aside>

        <main className="app-main-content">{children}</main>
      </div>

      <div className={`app-bottom-nav${bottomNavClassName ? ` ${bottomNavClassName}` : ""}`}>
        <BottomNav variant={variant === "discover" ? "discover" : "default"} />
      </div>

      <BottomSheet open={mobileSettingsOpen} onClose={() => setMobileSettingsOpen(false)} title="Filters & Settings">
        <div className="app-mobile-sheet-content">
          <p className="app-mobile-sheet-copy">Discover-specific filters are available on the Discover screen.</p>
          <button
            onClick={toggle}
            className="app-mobile-sheet-button"
          >
            Theme: {theme === "light" ? "Light" : "Dark"}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
