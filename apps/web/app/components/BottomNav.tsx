"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/app/discover", label: "Discover" },
  { href: "/app/requests", label: "Likes" },
  { href: "/app/matches", label: "Matches" }
];

export default function BottomNav() {
  const pathname = usePathname();
  const activeHref = navItems.find((item) => pathname?.startsWith(item.href))?.href ?? "";

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={activeHref === item.href ? "bottom-nav__link active" : "bottom-nav__link"}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
