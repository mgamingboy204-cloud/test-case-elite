"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "@/app/providers";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();

  return (
    <div className="auth-shell">
      <div className="bg-overlay" />
      <div className="top-row">
        <Link href="/" className="brand">Elite Match</Link>
        <button onClick={toggle} className="theme-btn" aria-label="Toggle theme">
          {theme === "light" ? "☾" : "☀"}
        </button>
      </div>

      <aside className="auth-panel">{children}</aside>

      <style jsx>{`
        .auth-shell { min-height: 100vh; min-height: 100dvh; position: relative; background-image: url('https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?auto=format&fit=crop&w=2200&q=80'); background-size: cover; background-position: center; display: flex; justify-content: flex-end; align-items: stretch; }
        .bg-overlay { position: absolute; inset: 0; background: radial-gradient(circle at 70% 25%, rgba(0,0,0,0.08), rgba(0,0,0,0.68)); }
        .top-row { position: absolute; top: 18px; left: 18px; right: 18px; z-index: 3; display: flex; align-items: center; justify-content: space-between; }
        .brand { font-size: 29px; font-weight: 800; letter-spacing: -0.03em; color: #fff; }
        .theme-btn { width: 38px; height: 38px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.22); background: rgba(255,255,255,0.08); backdrop-filter: blur(14px); color: #fff; }
        .auth-panel { width: min(480px, 100%); z-index: 2; padding: 96px 24px 24px; background: rgba(255,255,255,0.05); border-left: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(18px); display: flex; align-items: center; justify-content: center; }
        :global([data-theme='light']) .auth-shell { background-image: url('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=2200&q=80'); }
        :global([data-theme='light']) .bg-overlay { background: radial-gradient(circle at 70% 24%, rgba(255,255,255,0.2), rgba(255,255,255,0.66)); }
        :global([data-theme='light']) .brand, :global([data-theme='light']) .theme-btn { color: #1f2533; }
        :global([data-theme='light']) .theme-btn { border-color: rgba(17,24,39,0.2); background: rgba(255,255,255,0.66); }
        :global([data-theme='light']) .auth-panel { background: rgba(255,255,255,0.58); border-left-color: rgba(255,255,255,0.75); }
        @media (max-width: 900px) {
          .auth-shell { align-items: flex-end; }
          .auth-panel { width: 100%; padding: 84px 16px calc(16px + env(safe-area-inset-bottom)); border-radius: 28px 28px 0 0; border-left: none; border-top: 1px solid rgba(255,255,255,0.18); min-height: 78vh; background: rgba(255,255,255,0.08); }
          :global([data-theme='light']) .auth-panel { background: rgba(255,255,255,0.72); }
        }
      `}</style>
    </div>
  );
}
