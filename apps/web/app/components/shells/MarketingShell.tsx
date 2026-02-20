"use client";

import Link from "next/link";
import { useTheme } from "@/app/providers";
import { type ReactNode, useState } from "react";

const navLinks = [
  { href: "/learn", label: "How It Works" },
  { href: "/safety", label: "Safety" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
];

const footerLinks = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/cookie-policy", label: "Cookies" },
  { href: "/contact", label: "Contact" },
  { href: "/safety", label: "Safety" },
];

export function MarketingShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <header className="marketing-header">
        <div className="nav-row">
          <Link href="/" className="logo">Elite Match</Link>

          <nav className="desktop-nav">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="actions">
            <button onClick={toggle} className="theme-btn" aria-label="Toggle theme">
              {theme === "light" ? "☾" : "☀"}
            </button>
            <Link href="/login" className="signin-btn">Sign In</Link>
            <button className="mobile-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button>
          </div>
        </div>
      </header>

      <main style={{ flex: 1 }}>{children}</main>

      <footer className="marketing-footer">
        <div className="footer-inner">
          <div style={{ fontSize: 14, color: "var(--muted)" }}>
            &copy; {new Date().getFullYear()} Elite Match. All rights reserved.
          </div>
          <nav className="footer-nav">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="footer-link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

      {menuOpen && (
          <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
            <div className="mobile-menu-sheet" onClick={(event) => event.stopPropagation()}>
              <div className="sheet-handle" />
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="sheet-link" onClick={() => setMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <Link href="/login" className="sheet-signin" onClick={() => setMenuOpen(false)}>
                Sign In
              </Link>
            </div>
          </div>
        )}

      <style jsx>{`
        .marketing-header { position: fixed; inset: 14px 14px auto; z-index: 40; border: 1px solid rgba(255,255,255,0.1); background: rgba(10,12,18,0.45); backdrop-filter: blur(15px); border-radius: 999px; }
        .nav-row { max-width: 1200px; margin: 0 auto; padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .logo { font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .desktop-nav { display: flex; align-items: center; gap: 20px; }
        .nav-link { color: rgba(255,255,255,0.8); font-size: 14px; }
        .actions { display: flex; align-items: center; gap: 10px; }
        .theme-btn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.08); color: #fff; }
        .signin-btn { padding: 9px 16px; border-radius: 999px; background: linear-gradient(120deg, #ff4d5a, #d12836); color: #fff; font-size: 14px; font-weight: 700; box-shadow: inset 0 1px 0 rgba(255,255,255,0.4); }
        .mobile-menu-btn { display: none; color: #fff; font-size: 24px; }
        .marketing-footer { border-top: 1px solid var(--border); background: rgba(255,255,255,0.02); }
        .footer-inner { max-width: 1200px; margin: 0 auto; padding: 24px; display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
        .footer-nav { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
        .footer-link { color: var(--muted); font-size: 13px; line-height: 1.9; padding: 4px 2px; }
        .mobile-menu-overlay { position: fixed; inset: 0; z-index: 80; background: rgba(5,8,14,0.56); backdrop-filter: blur(12px); display: flex; align-items: flex-end; }
        .mobile-menu-sheet { width: 100%; border-radius: 22px 22px 0 0; padding: 16px 20px calc(24px + env(safe-area-inset-bottom)); border-top: 1px solid rgba(255,255,255,0.2); background: rgba(255,255,255,0.08); backdrop-filter: blur(22px); display: flex; flex-direction: column; gap: 12px; }
        .sheet-handle { width: 46px; height: 5px; border-radius: 999px; background: rgba(255,255,255,0.4); margin: 0 auto 6px; }
        .sheet-link { color: #fff; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.1); font-weight: 500; }
        .sheet-signin { margin-top: 4px; text-align: center; padding: 13px; border-radius: 999px; color: #fff; background: linear-gradient(120deg, #ff4d5a, #d12836); font-weight: 700; }
        @media (max-width: 880px) {
          .desktop-nav, .signin-btn { display: none; }
          .mobile-menu-btn { display: block; }
          .marketing-header { inset: 10px 10px auto; }
          .footer-inner { justify-content: center; text-align: center; }
          .footer-nav { width: 100%; gap: 12px 20px; }
        }
        :global([data-theme='light']) .marketing-header { background: rgba(255,255,255,0.62); border-color: rgba(255,255,255,0.8); }
        :global([data-theme='light']) .logo, :global([data-theme='light']) .nav-link, :global([data-theme='light']) .theme-btn { color: #22293a; }
        :global([data-theme='light']) .theme-btn { background: rgba(255,255,255,0.75); border-color: rgba(20,20,30,0.1); }
      `}</style>
    </div>
  );
}
