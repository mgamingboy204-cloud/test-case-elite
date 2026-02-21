"use client";

import Link from "next/link";
import { useTheme } from "@/app/providers";
import { type ReactNode, useState } from "react";

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

  return (
    <div className="shell-root">
      <header className="marketing-header">
        <div className="nav-row">
          <Link href="/" className="logo marketing-tap-target">Elite Match</Link>

          <nav className="desktop-nav">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link marketing-tap-target">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="actions">
            <button onClick={toggle} className="theme-btn marketing-tap-target" aria-label="Toggle theme">
              {theme === "light" ? "☾" : "☀"}
            </button>
            <Link href="/login" className="signin marketing-tap-target">Sign In</Link>
            <Link href="/signup" className="request-btn marketing-rose-btn marketing-tap-target">Request Invitation</Link>
            <button className="mobile-menu-btn marketing-tap-target" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button>
          </div>
        </div>
      </header>

      <main className="shell-main">{children}</main>

      <footer className="marketing-footer">
        <div className="footer-inner">
          <div className="copyright">© {new Date().getFullYear()} Elite Match. All rights reserved.</div>
          <nav className="footer-nav">
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="footer-link marketing-tap-target">
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
              <Link key={link.href} href={link.href} className="sheet-link marketing-tap-target" onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/login" className="sheet-signin marketing-tap-target" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
            <Link href="/signup" className="sheet-invite marketing-rose-btn marketing-tap-target" onClick={() => setMenuOpen(false)}>
              Request Invitation
            </Link>
          </div>
        </div>
      )}

      <style jsx>{`
        .shell-root { min-height: 100dvh; display: flex; flex-direction: column; }
        .marketing-header {
          position: fixed;
          inset: calc(env(safe-area-inset-top, 0px) + 10px) 14px auto;
          z-index: 40;
        }
        .shell-main { flex: 1; }
        .nav-row {
          width: min(1760px, calc(100vw - 28px));
          margin: 0 auto;
          min-height: 74px;
          border-radius: 999px;
          border: 1px solid var(--marketing-glass-border);
          background: var(--marketing-glass);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          padding: 10px 30px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .logo { color: var(--marketing-heading); font-size: 40px; font-family: var(--font-playfair), "Playfair Display", Georgia, serif; font-weight: 700; letter-spacing: -0.02em; line-height: 1.1; }
        .desktop-nav { display: flex; align-items: center; gap: 30px; }
        .nav-link { color: var(--marketing-text-strong); font-size: 36px; font-weight: 600; }
        .actions { display: flex; align-items: center; gap: 10px; }
        .theme-btn {
          width: 44px;
          height: 44px;
          border-radius: 999px;
          border: 1px solid var(--marketing-glass-border);
          background: rgba(255, 255, 255, 0.55);
          color: var(--marketing-text-strong);
          font-size: 22px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .signin { color: var(--marketing-text-strong); font-size: 34px; font-weight: 600; padding-right: 8px; }
        .request-btn { padding: 0 24px; display: inline-flex; align-items: center; justify-content: center; }
        .mobile-menu-btn { display: none; color: var(--marketing-text-strong); font-size: 24px; }
        .marketing-footer {
          margin-top: auto;
          border-top: 1px solid var(--marketing-glass-border);
          background: rgba(253, 252, 248, 0.84);
          backdrop-filter: blur(15px);
        }
        .footer-inner {
          width: min(1360px, calc(100% - 40px));
          margin: 0 auto;
          padding: 26px 0 calc(26px + env(safe-area-inset-bottom, 0px));
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .copyright { color: var(--marketing-text-muted); font-size: 15px; }
        .footer-nav { display: flex; gap: 26px; flex-wrap: wrap; }
        .footer-link { color: var(--marketing-text-strong); font-size: 17px; }
        .mobile-menu-overlay { position: fixed; inset: 0; z-index: 80; background: rgba(3, 7, 16, 0.48); backdrop-filter: blur(8px); display: flex; align-items: flex-end; }
        .mobile-menu-sheet { width: 100%; border-radius: 22px 22px 0 0; padding: 16px 20px calc(24px + env(safe-area-inset-bottom)); border-top: 1px solid var(--marketing-glass-border); background: var(--marketing-bg-start); display: flex; flex-direction: column; gap: 12px; }
        .sheet-handle { width: 46px; height: 5px; border-radius: 999px; background: rgba(142, 90, 90, 0.45); margin: 0 auto 6px; }
        .sheet-link { color: var(--marketing-text-strong); padding: 14px 0; border-bottom: 1px solid var(--marketing-glass-border); }
        .sheet-signin, .sheet-invite { margin-top: 4px; text-align: center; padding: 13px; border-radius: 999px; }
        .sheet-signin { border: 1px solid var(--marketing-glass-border); color: var(--marketing-text-strong); }
        @media (max-width: 1100px) {
          .desktop-nav, .signin, .request-btn { display: none; }
          .mobile-menu-btn { display: block; }
          .logo { font-size: 28px; }
          .nav-row { min-height: 62px; }
        }
      `}</style>
    </div>
  );
}
