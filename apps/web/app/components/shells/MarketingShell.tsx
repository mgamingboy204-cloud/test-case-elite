"use client";

import Link from "next/link";
import { useTheme } from "@/app/providers";
import { type ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/learn", label: "Protocol" },
  { href: "/safety", label: "Trust" },
  { href: "/faq", label: "Inquiry" },
  { href: "/support", label: "Concierge" },
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
    <div className="min-h-screen flex flex-col bg-[#faf8f6] selection:bg-primary/20 selection:text-primary">
      {/* Cinematic Header Overlay */}
      <div className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/60 to-transparent z-30 pointer-events-none" />

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-7xl"
      >
        <div className="bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] rounded-full px-8 py-3 flex items-center justify-between gap-8 transition-all duration-700 hover:shadow-[0_30px_60px_-15px_rgba(232,165,178,0.1)]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-primary/60 flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:rotate-12 transition-transform duration-700">
              <span className="text-lg font-serif italic">E</span>
            </div>
            <span className="text-xl font-serif italic tracking-tight text-foreground/80 group-hover:text-primary transition-colors duration-700">
              Elite Match
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[11px] uppercase tracking-[0.4em] font-black text-muted-foreground/40 hover:text-primary transition-all duration-500 italic"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={toggle}
              className="w-10 h-10 rounded-full border border-primary/5 bg-white/40 flex items-center justify-center text-primary/40 hover:text-primary hover:border-primary/20 transition-all duration-500 group"
              aria-label="Toggle theme"
            >
              <span className="group-hover:rotate-45 transition-transform duration-700 text-lg">
                {theme === "light" ? "☾" : "☀"}
              </span>
            </button>
            <Link
              href="/login"
              className="hidden sm:inline-flex px-8 py-3 rounded-full bg-primary/5 text-primary border border-primary/10 text-[10px] uppercase tracking-[0.3em] font-black hover:bg-primary hover:text-white transition-all duration-700 italic shadow-sm"
            >
              Entry
            </Link>
            <button
              className="lg:hidden w-10 h-10 flex flex-col items-center justify-center gap-1.5"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <div className="w-5 h-0.5 bg-primary/40 rounded-full" />
              <div className="w-5 h-0.5 bg-primary/40 rounded-full" />
            </button>
          </div>
        </div>
      </motion.header>

      <main className="flex-1 relative">
        {children}
      </main>

      <footer className="border-t border-primary/5 bg-white/40 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-12">
            <div className="flex flex-col items-center lg:items-start gap-4">
              <Link href="/" className="text-2xl font-serif italic text-foreground/60 tracking-tight">
                Elite Match
              </Link>
              <p className="text-[10px] uppercase tracking-[0.5em] font-black text-muted-foreground/20 italic">
                &copy; {new Date().getFullYear()} The Collective. All Rights Reserved.
              </p>
            </div>

            <nav className="flex flex-wrap justify-center gap-x-12 gap-y-4">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[10px] uppercase tracking-[0.4em] font-black text-muted-foreground/30 hover:text-primary transition-all duration-500 italic"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-16 flex flex-col items-center gap-6 opacity-20">
            <div className="w-12 h-px bg-primary/40" />
            <p className="text-[9px] uppercase tracking-[0.6em] font-black text-muted-foreground italic">
              Premium End-to-End Encryption Mode Active
            </p>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-[#faf8f6]/80 backdrop-blur-2xl flex items-center justify-center p-8"
            onClick={() => setMenuOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-white/40 border border-white/60 shadow-2xl rounded-[3rem] p-12 space-y-8 text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-8 right-8 text-primary/40 hover:text-primary transition-colors text-2xl"
                onClick={() => setMenuOpen(false)}
              >
                ✕
              </button>

              <div className="space-y-6 pt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block text-2xl font-serif italic text-foreground/60 hover:text-primary transition-all duration-500"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="pt-8 border-t border-primary/5">
                <Link
                  href="/login"
                  className="block w-full py-6 rounded-full bg-primary text-white text-[10px] uppercase tracking-[0.4em] font-black italic shadow-xl shadow-primary/20"
                  onClick={() => setMenuOpen(false)}
                >
                  Secure Entry
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
