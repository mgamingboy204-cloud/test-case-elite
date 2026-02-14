"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { PremiumBadge } from "@/app/components/premium/PremiumBadge";
import { PremiumButton } from "@/app/components/premium/PremiumButton";
import { PremiumShell } from "@/app/components/premium/PremiumShell";
import { useTheme } from "@/app/providers";

const navLinks = [
  { href: "/learn", label: "How It Works" },
  { href: "/safety", label: "Safety" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" }
];

const footerLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookie-policy", label: "Cookies" },
  { href: "/contact", label: "Contact" },
  { href: "/safety", label: "Safety" }
];

export function MarketingShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <PremiumShell variant="hero">
      <div className="marketing-shell">
        <header className="marketing-header">
          <div className="marketing-header__inner">
            <Link href="/" className="marketing-logo">
              Elite Match
            </Link>
            <PremiumBadge>Invite-only • Verified</PremiumBadge>
            <nav className="marketing-nav" aria-label="Primary navigation">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href} className={`marketing-nav__link ${isActive ? "is-active" : ""}`}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
            <div className="marketing-header__actions">
              <button type="button" onClick={toggle} className="theme-toggle" aria-label="Toggle theme">
                {theme === "light" ? "☾" : "☀"}
              </button>
              <Link href="/login" aria-label="Sign in to your account">
                <PremiumButton>Sign In</PremiumButton>
              </Link>
              <button type="button" className="mobile-menu-btn" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
                {menuOpen ? "✕" : "☰"}
              </button>
            </div>
          </div>
          {menuOpen ? (
            <nav className="marketing-mobile-nav fade-in">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="marketing-mobile-nav__link">
                  {link.label}
                </Link>
              ))}
            </nav>
          ) : null}
        </header>

        <main className="marketing-main">{children}</main>

        <footer className="marketing-footer">
          <p>© {new Date().getFullYear()} Elite Match. All rights reserved.</p>
          <nav aria-label="Footer navigation">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </footer>
      </div>
    </PremiumShell>
  );
}
