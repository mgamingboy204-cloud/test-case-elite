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
  { href: "/contact", label: "Contact" }
];

export function MarketingShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="shell-root">
      <header className="marketing-header marketing-panel">
        <div className="nav-row">
          <Link href="/" className="logo">Elite Match</Link>

          <nav className="desktop-nav">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="nav-link marketing-interactive">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="actions">
            <button onClick={toggle} className="theme-btn marketing-interactive" aria-label="Toggle theme">
              {theme === "light" ? "☾" : "☀"}
            </button>
            <Link href="/signup" className="invite-btn marketing-interactive">Request Invitation</Link>
            <button className="mobile-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button>
          </div>
        </div>
      </header>

      <main className="shell-main">{children}</main>

      <footer className="marketing-footer">
        <div className="footer-inner">
          <div style={{ fontSize: 14, color: "var(--marketing-text-muted)" }}>
            © {new Date().getFullYear()} Elite Match. Invitation-only introductions.
          </div>
          <nav className="footer-nav">
            <Link href="/" className="footer-link">Back to Home</Link>
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} className="footer-link">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

      <div className="mobile-cta">
        <Link href="/" className="cta-home">Home</Link>
        <Link href="/signup" className="cta-request">Request Invitation</Link>
      </div>

      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="sheet-link" onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/signup" className="sheet-signin" onClick={() => setMenuOpen(false)}>
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
          border-radius: 999px;
        }
        .shell-main { flex: 1; }
        .nav-row { max-width: 1200px; margin: 0 auto; padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 56px; }
        .logo { font-size: 20px; font-weight: 800; color: var(--marketing-text-strong); letter-spacing: -0.02em; padding: 8px 4px; }
        .desktop-nav { display: flex; align-items: center; gap: 20px; }
        .nav-link { color: var(--marketing-text-strong); font-size: 15px; padding: 12px 8px; border-radius: 999px; }
        .actions { display: flex; align-items: center; gap: 10px; }
        .theme-btn { width: 44px; height: 44px; border-radius: 999px; border: 1px solid var(--marketing-glass-border); background: rgba(255,255,255,0.2); color: var(--marketing-text-strong); }
        .invite-btn { min-height: 44px; display: inline-flex; align-items: center; padding: 0 18px; border-radius: 999px; background: linear-gradient(120deg, #ff4d5a, #d12836); color: #fff; font-size: 14px; font-weight: 700; box-shadow: inset 0 1px 0 rgba(255,255,255,0.3); }
        .mobile-menu-btn { display: none; color: var(--marketing-text-strong); font-size: 24px; min-width: 44px; min-height: 44px; }
        .marketing-footer { border-top: 1px solid var(--marketing-glass-border); background: linear-gradient(180deg, transparent, rgba(148, 163, 184, 0.05)); }
        .footer-inner { max-width: 1200px; margin: 0 auto; padding: 26px 24px calc(88px + env(safe-area-inset-bottom, 0px)); display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; }
        .footer-nav { display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; }
        .footer-link { color: var(--marketing-text-muted); font-size: 14px; line-height: 1.9; padding: 8px 4px; min-height: 44px; display: inline-flex; align-items: center; }
        .mobile-cta { display: none; }
        .mobile-menu-overlay { position: fixed; inset: 0; z-index: 80; background: rgba(5,8,14,0.46); backdrop-filter: blur(12px); display: flex; align-items: flex-end; }
        .mobile-menu-sheet { width: 100%; border-radius: 22px 22px 0 0; padding: 16px 20px calc(24px + env(safe-area-inset-bottom)); border-top: 1px solid var(--marketing-glass-border); background: var(--marketing-glass); backdrop-filter: blur(22px); display: flex; flex-direction: column; gap: 12px; }
        .sheet-handle { width: 46px; height: 5px; border-radius: 999px; background: var(--marketing-text-muted); opacity: 0.5; margin: 0 auto 6px; }
        .sheet-link { color: var(--marketing-text-strong); padding: 14px 0; border-bottom: 1px solid var(--marketing-glass-border); font-weight: 500; min-height: 44px; display: flex; align-items: center; }
        .sheet-signin { margin-top: 4px; text-align: center; padding: 13px; border-radius: 999px; color: #fff; background: linear-gradient(120deg, #ff4d5a, #d12836); font-weight: 700; min-height: 44px; }
        @media (max-width: 880px) {
          .desktop-nav, .invite-btn { display: none; }
          .mobile-menu-btn { display: block; }
          .marketing-header { inset: calc(env(safe-area-inset-top, 0px) + 8px) 10px auto; }
          .footer-inner { justify-content: center; text-align: center; }
          .footer-nav { width: 100%; gap: 8px 16px; }
          .mobile-cta {
            position: fixed;
            left: 10px;
            right: 10px;
            bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
            display: grid;
            grid-template-columns: 1fr 1.4fr;
            gap: 10px;
            z-index: 60;
            padding: 10px;
            border-radius: 18px;
            background: var(--marketing-glass);
            border: 1px solid var(--marketing-glass-border);
            backdrop-filter: blur(14px);
          }
          .cta-home, .cta-request { min-height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 600; }
          .cta-home { color: var(--marketing-text-strong); background: rgba(148, 163, 184, 0.12); }
          .cta-request { color: #fff; background: linear-gradient(120deg, #ff4d5a, #d12836); }
        }
      `}</style>
    </div>
  );
}
