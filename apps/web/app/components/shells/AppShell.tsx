"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/app/providers";
import { BottomNav } from "@/app/components/BottomNav";
import type { ReactNode, CSSProperties } from "react";

const sidebarLinks = [
  { href: "/discover", label: "Discover", icon: "\u2738" },
  { href: "/likes", label: "Likes", icon: "\u2665" },
  { href: "/matches", label: "Matches", icon: "\u263A" },
  { href: "/profile", label: "Profile", icon: "\u263B" },
  { href: "/settings", label: "Settings", icon: "\u2699" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const isDiscoverRoute = pathname.startsWith("/discover");
  const headerStyle: CSSProperties = {
    minHeight: 56,
    background: "color-mix(in srgb, var(--surface2) 88%, transparent)",
    borderBottom: "1px solid var(--discover-border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "max(12px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) 12px max(16px, env(safe-area-inset-left, 0px))",
    position: "sticky",
    top: 0,
    zIndex: 50,
    backdropFilter: "blur(12px) saturate(120%)",
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <header style={headerStyle} className="app-header">
        <Link
          href="/discover"
          style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}
        >
          Elite Match
        </Link>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button
            onClick={toggle}
            style={{
              width: 32,
              height: 32,
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              border: "1px solid var(--border)",
              background: "var(--panel)",
              color: "var(--text)",
            }}
            aria-label="Toggle theme"
          >
            {theme === "light" ? "\u263E" : "\u2600"}
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Desktop sidebar */}
        <aside
          className="app-sidebar"
          style={{
            width: 220,
            background: "var(--panel)",
            borderRight: "1px solid var(--border)",
            padding: "16px 0",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            position: "sticky",
            top: 56,
            height: "calc(100dvh - 56px)",
            overflowY: "auto",
          }}
        >
          {sidebarLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 24px",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--primary)" : "var(--text)",
                  background: active ? "var(--primary-light)" : "transparent",
                  borderRight: active ? "3px solid var(--primary)" : "3px solid transparent",
                  transition: "all 150ms ease",
                }}
              >
                <span style={{ fontSize: 18 }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </aside>

        {/* Content area */}
        <main
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            maxWidth: 800,
            margin: "0 auto",
            padding: isDiscoverRoute
              ? "0"
              : "16px max(16px, env(safe-area-inset-right, 0px)) calc(102px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px))",
            overflowY: isDiscoverRoute ? "hidden" : "auto",
            width: "100%",
          }}
          className={isDiscoverRoute ? "app-main app-main--discover" : "app-main"}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {!isDiscoverRoute ? (
        <div className="app-bottom-nav">
          <BottomNav fixed />
        </div>
      ) : null}

      <style>{`
        @media (max-width: 768px) {
          .app-sidebar { display: none !important; }
          .app-bottom-nav { display: block; }
          .app-main--discover {
            max-width: 100%;
            margin: 0;
          }
        }
        @media (min-width: 769px) {
          .app-bottom-nav { display: none; }
        }
      `}</style>
    </div>
  );
}
