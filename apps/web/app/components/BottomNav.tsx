"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type BottomNavProps = {
  className?: string;
  variant?: "default" | "discover";
};

const tabs = [
  {
    href: "/discover",
    label: "Discover",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--primary)" : "var(--text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill={active ? "var(--primary)" : "none"} />
      </svg>
    ),
  },
  {
    href: "/likes",
    label: "Likes",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "var(--primary)" : "none"} stroke={active ? "var(--primary)" : "var(--text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
  {
    href: "/matches",
    label: "Matches",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--primary)" : "var(--text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--primary)" : "var(--text-secondary)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export function BottomNav({ className, variant = "default" }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav className={`app-mobile-bottom-nav${className ? ` ${className}` : ""}`} data-variant={variant} aria-label="Main navigation">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="app-mobile-bottom-nav__link"
            aria-current={active ? "page" : undefined}
          >
            {tab.icon(active)}
            <span className="app-mobile-bottom-nav__label">
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
