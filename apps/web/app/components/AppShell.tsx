"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BottomNav from "./BottomNav";
import { useSession } from "../../lib/session";

const titleMap: { prefix: string; title: string }[] = [
  { prefix: "/discover", title: "Discover" },
  { prefix: "/likes", title: "Likes" },
  { prefix: "/matches", title: "Matches" },
  { prefix: "/profile", title: "Profile" },
  { prefix: "/settings", title: "Settings" }
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

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const title = getTitle(pathname);
  const avatarLabel = user?.displayName?.[0] ?? user?.phone?.[0] ?? "E";

  return (
    <div className="app-root">
      <aside className="app-rail" aria-label="Primary">
        <div className="rail-brand">Elite Match</div>
        <nav className="rail-nav">
          {railItems.map((item) => {
            const isActive = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "rail-link active" : "rail-link"}
                title={item.label}
              >
                <RailIcon type={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="app-shell">
        <header className="app-header">
          <button
            className="app-avatar"
            type="button"
            onClick={() => router.push("/profile")}
            aria-label="Open profile"
          >
            <span>{avatarLabel}</span>
          </button>
          <div className="app-title" aria-live="polite">
            {title}
          </div>
          <button
            className="app-icon-button"
            type="button"
            onClick={() => router.push("/settings")}
            aria-label="Open settings"
          >
            <RailIcon type="settings" />
          </button>
        </header>
        <main className="app-content">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
