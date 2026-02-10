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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--panel)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "var(--primary)",
              letterSpacing: "-0.02em",
            }}
          >
            Elite Match
          </Link>

          {/* Desktop nav */}
          <nav
            style={{
              display: "flex",
              alignItems: "center",
              gap: 32,
            }}
          >
            <div className="desktop-nav" style={{ display: "flex", gap: 24 }}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--muted)",
                    transition: "color 200ms",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--text)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                onClick={toggle}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  border: "1px solid var(--border)",
                  background: "var(--panel)",
                  color: "var(--text)",
                }}
                aria-label="Toggle theme"
              >
                {theme === "light" ? "\u263E" : "\u2600"}
              </button>
              <Link
                href="/login"
                style={{
                  padding: "8px 20px",
                  fontSize: 14,
                  fontWeight: 600,
                  borderRadius: "var(--radius-full)",
                  background: "var(--primary)",
                  color: "#fff",
                  transition: "opacity 150ms",
                }}
              >
                Sign In
              </Link>
            </div>
            {/* Mobile hamburger */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: "none",
                width: 36,
                height: 36,
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
              }}
              aria-label="Toggle menu"
            >
              {menuOpen ? "\u2715" : "\u2630"}
            </button>
          </nav>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div
            className="fade-in"
            style={{
              padding: "16px 24px 24px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{ fontSize: 16, fontWeight: 500, color: "var(--text)" }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main */}
      <main style={{ flex: 1 }}>{children}</main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          background: "var(--panel)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "32px 24px",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div style={{ fontSize: 14, color: "var(--muted)" }}>
            &copy; {new Date().getFullYear()} Elite Match. All rights reserved.
          </div>
          <nav style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  transition: "color 200ms",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
