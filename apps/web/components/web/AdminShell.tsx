"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/app/providers";
import type { ReactNode, CSSProperties } from "react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: "\u25A6" },
  { href: "/admin/users", label: "Users", icon: "\u263B" },
  { href: "/admin/video-verifications", label: "Verifications", icon: "\u2714" },
  { href: "/admin/reports", label: "Reports", icon: "\u2691" },
  { href: "/admin/refunds", label: "Refunds", icon: "\u21A9" },
  { href: "/admin/matches", label: "Matches", icon: "\u2665" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const isExact = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header
        style={{
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
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            href="/admin"
            style={{ fontSize: 18, fontWeight: 800, color: "var(--primary)" }}
          >
            Elite Match
          </Link>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              background: "var(--primary-light)",
              color: "var(--primary)",
              borderRadius: "var(--radius-full)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Admin
          </span>
        </div>
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
          <Link
            href="/discover"
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--muted)",
              padding: "6px 14px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            App
          </Link>
        </div>
      </header>

      <div style={{ flex: 1, display: "flex" }}>
        {/* Content */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            padding: "0 24px 48px",
            maxWidth: 1100,
            margin: "0 auto",
            width: "100%",
          }}
        >
          {children}
        </main>

        {/* Right sidebar nav */}
        <aside
          className="admin-sidebar"
          style={{
            width: 200,
            background: "var(--panel)",
            borderLeft: "1px solid var(--border)",
            padding: "16px 0",
            position: "sticky",
            top: "var(--app-header-offset)",
            height: "calc(100vh - var(--app-header-offset))",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          {adminLinks.map((link) => {
            const active = isExact(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 20px",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--primary)" : "var(--text)",
                  background: active ? "var(--primary-light)" : "transparent",
                  borderLeft: active ? "3px solid var(--primary)" : "3px solid transparent",
                  transition: "all 150ms ease",
                }}
              >
                <span style={{ fontSize: 16 }}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </aside>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
}
