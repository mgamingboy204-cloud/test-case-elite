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

  const headerStyle: CSSProperties = {
    height: "var(--app-header-offset)",
    background: "var(--panel)",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    position: "sticky",
    top: 0,
    zIndex: 50,
    paddingTop: "var(--app-mobile-safe-top)",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top header (both mobile & desktop) */}
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

      <div style={{ flex: 1, display: "flex" }}>
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
            top: "var(--app-header-offset)",
            height: "calc(100vh - var(--app-header-offset))",
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
          className="app-main-content"
          style={{
            flex: 1,
            minWidth: 0,
            maxWidth: 800,
            margin: "0 auto",
            padding: "0 16px",
            width: "100%",
          }}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="app-bottom-nav">
        <BottomNav />
      </div>

      <style>{`
        .app-bottom-nav { display: none; }
        @media (max-width: 768px) {
          .app-sidebar { display: none !important; }
          .app-bottom-nav { display: block; }
          .app-main-content { padding-bottom: var(--app-bottom-nav-height); }
        }
      `}</style>
    </div>
  );
}
