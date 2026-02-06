"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import ThemeToggle from "./ThemeToggle";

type MarketingShellProps = {
  children: ReactNode;
};

export default function MarketingShell({ children }: MarketingShellProps) {
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
      </nav>
      <main className="marketing-main">{children}</main>
      <footer className="marketing-footer">
        <div className="marketing-footer__grid">
          <div className="marketing-footer__col">
            <h4>Legal</h4>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Cookie Policy</Link>
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
            <Link href="/support">Contact</Link>
          </div>
        </div>
        <div className="marketing-footer__bottom">© ELITE MATCH. All rights reserved.</div>
      </footer>
    </div>
  );
}
