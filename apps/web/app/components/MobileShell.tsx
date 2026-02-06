"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/likes", label: "Likes" },
  { href: "/discover", label: "Discover" },
  { href: "/matches", label: "Matches" }
];

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12.2a4.3 4.3 0 1 0-4.3-4.3 4.3 4.3 0 0 0 4.3 4.3Zm0 2c-3.8 0-7 2.1-7 4.6 0 1 .8 1.7 1.9 1.7h10.2c1 0 1.9-.7 1.9-1.7 0-2.5-3.2-4.6-7-4.6Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="m12 7.2 1.2-2.1 2.5.8-.4 2.5 1.9 1.3 1.7-1.3 1.6 2-2 1.5.4 2.4-2.4.9-1.1-2.2-2.4.1-1.1 2.2-2.4-.9.5-2.4-2-1.5 1.5-2 1.9 1.3 1.8-1.3-.3-2.5 2.4-.8 1.1 2.1Z"
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
        <Link href="/profile" className="mobile-shell__icon" aria-label="Profile">
          <ProfileIcon />
        </Link>
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
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
