"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/likes", label: "Likes", icon: "heart" },
  { href: "/discover", label: "Discover", icon: "compass" },
  { href: "/matches", label: "Matches", icon: "spark" },
  { href: "/profile", label: "Profile", icon: "user" }
];

function NavIcon({ type }: { type: string }) {
  switch (type) {
    case "heart":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 20.3c-4.3-3-7.6-6.2-7.6-10.1A4.4 4.4 0 0 1 8.9 5c1.4 0 2.7.6 3.1 1.7C12.4 5.6 13.7 5 15.1 5a4.4 4.4 0 0 1 4.5 5.2c0 3.9-3.3 7-7.6 10.1Z"
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
            d="M12 12.2a4.3 4.3 0 1 0-4.3-4.3 4.3 4.3 0 0 0 4.3 4.3Zm0 2c-3.8 0-7 2.1-7 4.6 0 1 .8 1.7 1.9 1.7h10.2c1 0 1.9-.7 1.9-1.7 0-2.5-3.2-4.6-7-4.6Z"
            fill="currentColor"
          />
        </svg>
      );
    case "compass":
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 2a10 10 0 1 0 10 10h-2.4a7.6 7.6 0 1 1-2.2-5.4l-3 3H22V2l-2.5 2.5A9.9 9.9 0 0 0 12 2Z"
            fill="currentColor"
          />
        </svg>
      );
  }
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm8.1 3.2c0-.4-.1-.8-.2-1.2l2-1.6-2-3.4-2.4.9a7.6 7.6 0 0 0-2.1-1.2L13 1h-4l-.4 3.9c-.7.3-1.4.7-2.1 1.2l-2.4-.9-2 3.4 2 1.6c-.1.4-.2.8-.2 1.2s.1.8.2 1.2l-2 1.6 2 3.4 2.4-.9c.7.5 1.3.9 2.1 1.2L9 23h4l.4-3.9c.7-.3 1.4-.7 2.1-1.2l2.4.9 2-3.4-2-1.6c.1-.4.2-.8.2-1.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

type MobileShellProps = {
  title?: string;
};

export default function MobileShell({ title }: MobileShellProps) {
  const pathname = usePathname();
  const activeHref = tabs.find((tab) => pathname?.startsWith(tab.href))?.href ?? "";

  return (
    <div className="mobile-shell">
      <header className="mobile-shell__topbar">
        <span className="mobile-shell__logo">ELITE MATCH</span>
        <span className="mobile-shell__title">{title || "ELITE MATCH"}</span>
        <Link href="/settings" className="mobile-shell__icon" aria-label="Settings">
          <SettingsIcon />
        </Link>
      </header>
      <nav className="mobile-shell__tabs" aria-label="Primary">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={activeHref === tab.href ? "mobile-shell__tab active" : "mobile-shell__tab"}
          >
            <NavIcon type={tab.icon} />
            <span>{tab.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
