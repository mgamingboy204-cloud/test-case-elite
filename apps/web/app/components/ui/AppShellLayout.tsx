"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "../../../lib/session";
import MobileShell from "../MobileShell";
import ThemeToggle from "../ThemeToggle";
import SidebarNavItem from "./SidebarNavItem";

const titleMap: { prefix: string; title: string }[] = [
  { prefix: "/discover", title: "Discover" },
  { prefix: "/likes", title: "Likes" },
  { prefix: "/matches", title: "Matches" },
  { prefix: "/profile", title: "Profile" },
  { prefix: "/settings", title: "Settings" },
  { prefix: "/admin", title: "Admin Control" }
];

const railItems = [
  { href: "/discover", label: "Discover", icon: "compass" },
  { href: "/likes", label: "Likes", icon: "heart" },
  { href: "/matches", label: "Matches", icon: "spark" },
  { href: "/profile", label: "Profile", icon: "user" },
  { href: "/settings", label: "Settings", icon: "settings" }
];

function getTitle(pathname: string | null) {
  if (!pathname) return "Discover";
  const match = titleMap.find((item) => pathname.startsWith(item.prefix));
  return match?.title ?? "Discover";
}

function RailIcon({ type }: { type: string }) {
  switch (type) {
    case "compass":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19Zm0 2.2a7.3 7.3 0 0 1 6.94 9.59l-3.77-3.77-6.64 6.64-3.77-3.77A7.3 7.3 0 0 1 12 4.7Zm-1.13 5.42 4.01 4.01-5.34 1.33 1.33-5.34Z"
            fill="currentColor"
          />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 20.2c-.3 0-.6-.1-.8-.3l-5.2-4.7C3.3 13.4 2 11.7 2 9.6 2 6.9 4.1 5 6.7 5c1.6 0 3.1.7 4.1 1.9C11.8 5.7 13.3 5 15 5c2.6 0 4.7 1.9 4.7 4.6 0 2.1-1.3 3.8-4 5.6l-5.2 4.7c-.2.2-.5.3-.8.3Z"
            fill="currentColor"
          />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.5 14.4 8l5.5 2.4-5.5 2.4L12 18.3 9.6 12.8 4.1 10.4 9.6 8 12 2.5Z"
            fill="currentColor"
          />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 12.4a4.2 4.2 0 1 0-4.2-4.2 4.2 4.2 0 0 0 4.2 4.2Zm0 2c-3.9 0-7.2 2.1-7.2 4.7 0 .9.8 1.6 1.8 1.6h10.8c1 0 1.8-.7 1.8-1.6 0-2.6-3.3-4.7-7.2-4.7Z"
            fill="currentColor"
          />
        </svg>
      );
    case "shield":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2.5 4.5 5.3v6.5c0 4.4 3.1 8.4 7.5 9.7 4.4-1.3 7.5-5.3 7.5-9.7V5.3L12 2.5Zm0 4.2 4.6 1.8v3.3c0 2.9-1.9 5.5-4.6 6.5-2.7-1-4.6-3.6-4.6-6.5V8.5L12 6.7Zm-1.3 5.2 2.2 2.2 4-4 1.1 1.1-5.1 5.1-3.3-3.3 1.1-1.1Z"
            fill="currentColor"
          />
        </svg>
      );
    case "settings":
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="m12 7.4 1.1-2.1 2.4.8-.3 2.4 1.8 1.3 1.8-1.3 1.5 2-2 1.5.5 2.4-2.4.8-1.1-2.1-2.3.1-1.1 2.1-2.4-.8.5-2.4-2-1.5 1.5-2 1.8 1.3 1.8-1.3-.3-2.4 2.4-.8 1.1 2.1ZM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"
            fill="currentColor"
          />
        </svg>
      );
  }
}

type AppShellLayoutProps = {
  children: ReactNode;
  rightPanel?: ReactNode;
};

export default function AppShellLayout({ children, rightPanel }: AppShellLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const title = getTitle(pathname);
  const avatarLabel = user?.displayName?.[0] ?? user?.phone?.[0] ?? "E";
  const isAdmin = user?.role === "ADMIN" || user?.isAdmin;

  return (
    <div className="app-shell-layout">
      <MobileShell title={title} />
      <aside className="app-rail" aria-label="Primary">
        <Link className="rail-brand" href="/discover">
          ELITE MATCH
        </Link>
        <nav className="rail-nav">
          {railItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <SidebarNavItem
                key={item.href}
                href={item.href}
                label={item.label}
                icon={<RailIcon type={item.icon} />}
                active={isActive}
              />
            );
          })}
          {isAdmin ? (
            <SidebarNavItem
              href="/admin"
              label="Admin Control"
              icon={<RailIcon type="shield" />}
              active={pathname?.startsWith("/admin")}
            />
          ) : null}
        </nav>
        <div className="rail-footer">
          <ThemeToggle />
          <button className="rail-avatar" type="button" onClick={() => router.push("/profile")}>
            {avatarLabel}
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-title">
            <span>{title}</span>
          </div>
        </header>

        <div className={rightPanel ? "app-content app-content--split" : "app-content"}>
          <div className="app-center">
            <div className="mobile-shell__content">{children}</div>
          </div>
          {rightPanel ? <aside className="app-right">{rightPanel}</aside> : null}
        </div>
      </div>
    </div>
  );
}
