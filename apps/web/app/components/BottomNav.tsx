"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";

const tabs = [
  {
    href: "/discover",
    label: "Discover",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--primary)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? "var(--primary)" : "none"} />
      </svg>
    ),
  },
  {
    href: "/likes",
    label: "Likes",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "var(--primary)" : "none"} stroke={active ? "var(--primary)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: "/matches",
    label: "Matches",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--primary)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--primary)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  const navStyle: CSSProperties = {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "color-mix(in srgb, var(--surface) 88%, var(--accent) 12%)",
    borderTop: "1px solid color-mix(in srgb, var(--border) 72%, var(--accent) 28%)",
    display: "flex",
    justifyContent: "space-around",
    alignItems: "center",
    height: 64,
    paddingBottom: "env(safe-area-inset-bottom, 0px)",
    boxShadow: "0 -8px 24px rgba(45, 32, 20, 0.12)",
    backdropFilter: "saturate(140%) blur(10px)",
    zIndex: 100,
  };

  return (
    <>
      <nav style={navStyle} aria-label="Main navigation">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                minHeight: 44,
                minWidth: 44,
                padding: "8px 16px",
                textDecoration: "none",
                transition: "transform 150ms ease",
              }}
              aria-current={active ? "page" : undefined}
            >
              {tab.icon(active)}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: active ? 600 : 400,
                  color: active ? "var(--primary)" : "var(--muted)",
                }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
      {/* Spacer */}
      <div style={{ height: "calc(64px + env(safe-area-inset-bottom, 0px))" }} />
    </>
  );
}
