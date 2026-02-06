"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

type MarketingShellProps = {
  children: ReactNode;
};

export default function MarketingShell({ children }: MarketingShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="marketing-shell">
      <nav className="marketing-nav">
        <Link href="/" className="marketing-logo" aria-label="ELITE MATCH home">
          ELITE MATCH
        </Link>
        <div className="marketing-nav__links">
          <Link href="/learn">Learn</Link>
          <Link href="/safety">Safety</Link>
          <Link href="/support">Support</Link>
        </div>
        <div className="marketing-nav__actions">
          <ThemeToggle variant="icon" label="Toggle dark mode" />
          <Link className="btn btn-secondary" href="/login">
            Log in
          </Link>
        </div>
        <button
          className="marketing-nav__menu-toggle"
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="marketing-mobile-menu"
          aria-label="Open menu"
        >
          <span />
          <span />
          <span />
        </button>
      </nav>
      <div
        id="marketing-mobile-menu"
        className={`marketing-mobile-menu ${menuOpen ? "is-open" : ""}`}
      >
        <div className="marketing-mobile-menu__panel">
          <Link href="/learn" onClick={() => setMenuOpen(false)}>
            Learn
          </Link>
          <Link href="/safety" onClick={() => setMenuOpen(false)}>
            Safety
          </Link>
          <Link href="/support" onClick={() => setMenuOpen(false)}>
            Support
          </Link>
          <Link href="/login" onClick={() => setMenuOpen(false)}>
            Log in
          </Link>
          <ThemeToggle variant="switch" label="Toggle dark mode" />
        </div>
      </div>
      <main className="marketing-main">{children}</main>
      <footer className="marketing-footer">
        <div className="marketing-footer__grid">
          <div className="marketing-footer__col">
            <h4>Legal</h4>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/cookie-policy">Cookie Policy</Link>
          </div>
          <div className="marketing-footer__col">
            <h4>Social</h4>
            <a href="https://instagram.com" rel="noreferrer" target="_blank">
              Instagram
            </a>
            <a href="https://x.com" rel="noreferrer" target="_blank">
              Twitter/X
            </a>
            <a href="https://youtube.com" rel="noreferrer" target="_blank">
              YouTube
            </a>
          </div>
          <div className="marketing-footer__col">
            <h4>FAQ</h4>
            <Link href="/faq">FAQ</Link>
            <Link href="/learn">Destinations</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div className="marketing-footer__bottom">© ELITE MATCH. All rights reserved.</div>
      </footer>
    </div>
  );
}
