"use client";

import Link from "next/link";
import { useTheme } from "@/app/providers";
import { type ReactNode, useEffect, useState } from "react";

const navLinks = [
  { href: "/why", label: "Why Elite Match" },
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
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsCompact(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="shell-root">
      <header className={`marketing-header marketing-panel ${isCompact ? "is-compact" : ""}`}>
        <div className="nav-row">
          <Link href="/" className="logo">Elite Match</Link>

          <nav className="desktop-nav" aria-label="Primary navigation">
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
            <Link href="/request" className="invite-btn marketing-interactive">Request Invitation</Link>
            <Link href="/app/login" className="invite-btn marketing-interactive" style={{ background: "transparent", color: "var(--marketing-text-strong)", border: "1px solid var(--marketing-glass-border)", boxShadow: "none" }}>Sign In</Link>
            <button className="mobile-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">☰</button>
          </div>
        </div>
      </header>

      <main className="shell-main">{children}</main>

      <footer className="marketing-footer">
        <div className="footer-inner">
          <p className="footer-copy">© 2026 Elite Match. Invitation-only introductions.</p>
          <nav className="footer-nav" aria-label="Footer links">
            <Link href="/" className="footer-link">Back to Home</Link>
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
            <Link href="/app/login" className="sheet-signin" onClick={() => setMenuOpen(false)}>
              Sign In
            </Link>
            <Link href="/request" className="sheet-subtle" onClick={() => setMenuOpen(false)}>
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
          transition: inset 250ms ease, transform 250ms ease, box-shadow 250ms ease;
        }
        .marketing-header.is-compact {
          inset: calc(env(safe-area-inset-top, 0px) + 6px) 20px auto;
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
        .shell-main { flex: 1; }
        .nav-row { max-width: 1240px; margin: 0 auto; padding: 10px 18px; display: flex; align-items: center; justify-content: space-between; gap: 16px; min-height: 56px; transition: min-height 250ms ease, padding 250ms ease; }
        .is-compact .nav-row { min-height: 50px; padding: 8px 16px; }
        .logo { font-size: clamp(1.05rem, 2vw, 1.2rem); font-weight: 700; color: var(--marketing-text-strong); letter-spacing: 0.02em; padding: 8px 4px; white-space: nowrap; }
        .desktop-nav { display: flex; align-items: center; gap: 20px; }
        .nav-link { color: var(--marketing-text-strong); font-size: 15px; padding: 10px 6px; border-radius: 999px; }
        .actions { display: flex; align-items: center; gap: 10px; }
        .theme-btn { width: 44px; height: 44px; border-radius: 999px; border: 1px solid var(--marketing-glass-border); background: color-mix(in srgb, var(--surface2) 55%, transparent); color: var(--marketing-text-strong); }
        .invite-btn { min-height: 44px; display: inline-flex; align-items: center; padding: 0 18px; border-radius: 999px; background: linear-gradient(120deg, var(--cta), var(--primary-hover)); color: var(--ctaText); font-size: 14px; font-weight: 700; box-shadow: inset 0 1px 0 color-mix(in srgb, var(--bg2) 65%, var(--surface)), 0 10px 26px color-mix(in srgb, var(--cta) 34%, transparent); }
        .mobile-menu-btn { display: none; color: var(--marketing-text-strong); font-size: 24px; min-width: 44px; min-height: 44px; }

        .marketing-footer { border-top: 1px solid var(--marketing-glass-border); background: linear-gradient(180deg, transparent, color-mix(in srgb, var(--accent2) 16%, transparent)); }
        .footer-inner { max-width: 1240px; margin: 0 auto; padding: 24px; display: flex; gap: 16px; justify-content: space-between; align-items: center; }
        .footer-copy { font-size: 14px; color: var(--marketing-text-muted); }
        .footer-nav { display: flex; flex-wrap: wrap; gap: 8px 16px; justify-content: center; }
        .footer-link { color: var(--marketing-text-muted); font-size: 14px; line-height: 1.8; padding: 8px 2px; min-height: 44px; display: inline-flex; align-items: center; }

        .mobile-menu-overlay { position: fixed; inset: 0; z-index: 80; background: color-mix(in srgb, var(--bg) 72%, transparent); backdrop-filter: blur(12px); display: flex; align-items: flex-end; }
        .mobile-menu-sheet { width: 100%; border-radius: 22px 22px 0 0; padding: 16px 20px calc(24px + env(safe-area-inset-bottom)); border-top: 1px solid var(--marketing-glass-border); background: var(--marketing-glass); backdrop-filter: blur(22px); display: flex; flex-direction: column; gap: 10px; }
        .sheet-handle { width: 46px; height: 5px; border-radius: 999px; background: var(--marketing-text-muted); opacity: 0.5; margin: 0 auto 6px; }
        .sheet-link { color: var(--marketing-text-strong); padding: 14px 0; border-bottom: 1px solid var(--marketing-glass-border); font-weight: 500; min-height: 44px; display: flex; align-items: center; }
        .sheet-signin { margin-top: 4px; text-align: center; padding: 13px; border-radius: 999px; color: var(--ctaText); background: linear-gradient(120deg, var(--cta), var(--primary-hover)); font-weight: 700; min-height: 44px; }
        .sheet-subtle { text-align: center; padding: 8px; color: var(--marketing-text-muted); min-height: 44px; display: grid; place-items: center; }

        @media (max-width: 880px) {
          .desktop-nav, .invite-btn { display: none; }
          .mobile-menu-btn { display: block; }
          .marketing-header { inset: calc(env(safe-area-inset-top, 0px) + 8px) 10px auto; }
          .marketing-header.is-compact { inset: calc(env(safe-area-inset-top, 0px) + 6px) 10px auto; }
          .footer-inner { justify-content: center; text-align: center; flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
