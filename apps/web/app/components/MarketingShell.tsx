"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type MarketingShellProps = {
  children: ReactNode;
};

const navLinks = [
  { href: "/learn", label: "Learn" },
  { href: "/safety", label: "Safety" },
  { href: "/support", label: "Support" },
];

const footerCols = [
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/cookie-policy", label: "Cookie Policy" },
    ],
  },
  {
    heading: "Social",
    links: [
      { href: "https://instagram.com", label: "Instagram", external: true },
      { href: "https://x.com", label: "Twitter / X", external: true },
      { href: "https://youtube.com", label: "YouTube", external: true },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/learn", label: "About" },
      { href: "/contact", label: "Contact" },
    ],
  },
];

export default function MarketingShell({ children }: MarketingShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menu when route changes or click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f6]">
      {/* ──────────────── NAVBAR ──────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-700 ${scrolled
            ? "py-3 bg-white/50 backdrop-blur-3xl border-b border-white/60 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.06)]"
            : "py-6 bg-transparent"
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            aria-label="Elite Match home"
            className="flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-700">
              <span className="text-primary group-hover:text-white text-xs font-black transition-colors duration-700">✦</span>
            </div>
            <span className="font-serif italic text-xl tracking-widest text-foreground/80 group-hover:text-primary transition-colors duration-700">
              ELITE MATCH
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-10" aria-label="Site navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/50 hover:text-primary transition-all duration-500 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-700" />
              </Link>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/login"
              className="text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/50 hover:text-primary transition-all duration-500"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground text-[10px] uppercase tracking-[0.3em] font-black hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-500 shadow-[0_8px_24px_-6px_rgba(232,165,178,0.5)]"
            >
              Join the Circle
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            ref={menuRef as any}
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="marketing-mobile-menu"
            aria-label="Toggle menu"
            className="md:hidden w-12 h-12 rounded-2xl bg-white/60 border border-white/80 flex items-center justify-center hover:bg-white/80 transition-all duration-500 relative z-[300]"
          >
            <div className="relative w-5 h-4 flex flex-col justify-between">
              <motion.span
                animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                className="block w-full h-[1.5px] bg-foreground/60 rounded-full origin-center"
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.span
                animate={menuOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                className="block w-3/4 h-[1.5px] bg-foreground/60 rounded-full"
                transition={{ duration: 0.3 }}
              />
              <motion.span
                animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                className="block w-full h-[1.5px] bg-foreground/60 rounded-full origin-center"
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
          </button>
        </div>
      </header>

      {/* ──────────────── MOBILE MENU ──────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="fixed inset-0 z-[150] bg-foreground/10 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />

            {/* Slide Panel */}
            <motion.div
              key="mobile-menu"
              id="marketing-mobile-menu"
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 bottom-0 z-[200] w-[min(80vw,380px)] bg-white/80 backdrop-blur-3xl border-l border-white/60 shadow-[-40px_0_80px_-20px_rgba(0,0,0,0.08)] flex flex-col"
            >
              {/* Menu header */}
              <div className="px-10 pt-24 pb-10 border-b border-primary/5">
                <p className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 italic mb-2">Navigation</p>
                <div className="w-12 h-px bg-primary/20" />
              </div>

              {/* Links */}
              <nav className="flex flex-col flex-grow px-10 py-10 gap-1" aria-label="Mobile navigation">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between py-5 border-b border-primary/[0.04] group"
                    >
                      <span className="font-serif italic text-4xl text-foreground/70 group-hover:text-primary transition-colors duration-500 tracking-tight">
                        {link.label}
                      </span>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-500">
                        <path d="M5 12h14m-7-7 7 7-7 7" />
                      </svg>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Auth CTAs */}
              <div className="px-10 pb-12 space-y-4">
                <Link
                  href="/signup"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center w-full py-5 rounded-2xl bg-primary text-primary-foreground text-[10px] uppercase tracking-[0.3em] font-black shadow-[0_8px_24px_-6px_rgba(232,165,178,0.5)] hover:opacity-90 transition-all duration-500"
                >
                  Join the Circle
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-center w-full py-4 text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40 hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ──────────────── MAIN CONTENT ──────────────── */}
      <main className="flex-grow pt-20">{children}</main>

      {/* ──────────────── FOOTER ──────────────── */}
      <footer className="relative border-t border-primary/5 bg-white/40 backdrop-blur-xl">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/4 w-64 h-32 bg-primary/[0.04] rounded-full blur-[80px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
            {/* Brand column */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <span className="text-primary text-xs font-black">✦</span>
                </div>
                <span className="font-serif italic text-xl tracking-widest text-foreground/80">ELITE MATCH</span>
              </div>
              <p className="text-sm text-muted-foreground/40 font-serif italic leading-relaxed max-w-[220px]">
                A meticulously curated environment for profound connections.
              </p>
              <div className="flex gap-3">
                {[
                  { href: "https://instagram.com", icon: "IG" },
                  { href: "https://x.com", icon: "X" },
                  { href: "https://youtube.com", icon: "YT" },
                ].map((s) => (
                  <a
                    key={s.href}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-xl bg-white/60 border border-white/80 flex items-center justify-center text-[9px] font-black text-muted-foreground/40 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all duration-500"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {footerCols.map((col) => (
              <div key={col.heading} className="space-y-6">
                <h4 className="text-[10px] uppercase tracking-[0.5em] font-black text-primary/40 italic">{col.heading}</h4>
                <ul className="space-y-4">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        {...("external" in link && link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                        className="text-sm font-serif italic text-muted-foreground/50 hover:text-primary transition-all duration-500 hover:translate-x-1 inline-block"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-primary/5">
            <p className="text-[10px] uppercase tracking-[0.5em] font-black text-muted-foreground/20 italic">
              © {new Date().getFullYear()} Elite Match. All rights reserved.
            </p>
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/20 italic">
              Premium End-to-End Encryption
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
