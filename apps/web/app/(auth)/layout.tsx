"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "@/app/providers";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { theme, toggle } = useTheme();

  return (
    <div className="auth-shell">
      <div className="auth-backdrop" aria-hidden="true" />
      <div className="auth-overlay" aria-hidden="true" />
      <div className="auth-vignette" aria-hidden="true" />
      <div className="auth-glow auth-glow-top" aria-hidden="true" />
      <div className="auth-glow auth-glow-bottom" aria-hidden="true" />

      <header className="top-row">
        <Link href="/" className="brand">Elite Match</Link>
        <button onClick={toggle} className="theme-btn" aria-label="Toggle theme">
          {theme === "light" ? "☾" : "☀"}
        </button>
      </header>

      <main className="auth-panel">{children}</main>

      <style jsx>{`
        .auth-shell {
          min-height: 100vh;
          min-height: 100dvh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: calc(20px + env(safe-area-inset-top, 0px)) calc(22px + env(safe-area-inset-right, 0px)) calc(22px + env(safe-area-inset-bottom, 0px)) calc(22px + env(safe-area-inset-left, 0px));
          background: linear-gradient(145deg, var(--bg2) 0%, var(--surface) 44%, var(--surface2) 100%);
        }
        .auth-backdrop,
        .auth-overlay,
        .auth-vignette,
        .auth-glow {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }
        .auth-backdrop {
          background-image: url('https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?auto=format&fit=crop&w=2200&q=80');
          background-size: cover;
          background-position: center;
          filter: blur(6px) saturate(0.86);
          transform: scale(1.05);
          opacity: 0.45;
        }
        .auth-overlay {
          background: linear-gradient(125deg, rgba(17, 13, 18, 0.86), rgba(28, 18, 24, 0.72));
          backdrop-filter: blur(2px);
        }
        .auth-vignette {
          background: radial-gradient(circle at center, rgba(255,255,255,0) 38%, rgba(5,4,7,0.65) 100%);
        }
        .auth-glow-top {
          background: radial-gradient(circle at 18% 16%, rgba(238, 177, 147, 0.2), rgba(238, 177, 147, 0) 42%);
        }
        .auth-glow-bottom {
          background: radial-gradient(circle at 82% 84%, rgba(199, 130, 121, 0.18), rgba(199, 130, 121, 0) 40%);
        }
        .top-row {
          position: absolute;
          top: calc(20px + env(safe-area-inset-top, 0px));
          left: calc(22px + env(safe-area-inset-left, 0px));
          right: calc(22px + env(safe-area-inset-right, 0px));
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .brand {
          font-size: clamp(1.45rem, 2.4vw, 1.9rem);
          font-weight: 800;
          letter-spacing: 0.02em;
          color: var(--text);
          text-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
        }
        .theme-btn {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(238, 202, 179, 0.42);
          background: rgba(38, 24, 32, 0.58);
          backdrop-filter: blur(16px);
          color: var(--text-secondary);
          box-shadow: 0 8px 24px rgba(12, 8, 12, 0.35);
          display: grid;
          place-items: center;
        }
        .auth-panel {
          position: relative;
          z-index: 3;
          width: min(92vw, 430px);
          border-radius: 32px;
          border: 1px solid rgba(244, 210, 186, 0.22);
          background: linear-gradient(145deg, rgba(35, 25, 34, 0.84), rgba(26, 20, 30, 0.8));
          backdrop-filter: blur(24px);
          box-shadow: 0 28px 68px rgba(8, 6, 10, 0.62);
        }
        :global([data-theme='light']) .auth-shell {
          background: linear-gradient(145deg, var(--bg) 0%, var(--surface2) 48%, var(--surface) 100%);
        }
        :global([data-theme='light']) .auth-backdrop {
          background-image: url('https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=2200&q=80');
          filter: blur(7px) saturate(0.68);
          opacity: 0.34;
        }
        :global([data-theme='light']) .auth-overlay {
          background: linear-gradient(135deg, rgba(247, 240, 231, 0.86), rgba(244, 234, 225, 0.8));
        }
        :global([data-theme='light']) .auth-vignette {
          background: radial-gradient(circle at center, rgba(255,255,255,0) 42%, rgba(228, 215, 202, 0.46) 100%);
        }
        :global([data-theme='light']) .auth-glow-top {
          background: radial-gradient(circle at 14% 14%, rgba(215, 181, 160, 0.32), rgba(215, 181, 160, 0) 44%);
        }
        :global([data-theme='light']) .auth-glow-bottom {
          background: radial-gradient(circle at 80% 80%, rgba(202, 171, 150, 0.24), rgba(202, 171, 150, 0) 38%);
        }
        :global([data-theme='light']) .brand {
          color: var(--text);
          text-shadow: none;
        }
        :global([data-theme='light']) .theme-btn {
          color: var(--text-secondary);
          border-color: rgba(185, 154, 132, 0.45);
          background: rgba(255, 250, 245, 0.72);
          box-shadow: 0 10px 24px rgba(143, 118, 95, 0.18);
        }
        :global([data-theme='light']) .auth-panel {
          border-color: rgba(198, 166, 142, 0.35);
          background: linear-gradient(145deg, rgba(255, 251, 247, 0.86), rgba(250, 243, 236, 0.8));
          box-shadow: 0 24px 50px rgba(98, 77, 59, 0.16);
        }
        @media (max-width: 900px) {
          .auth-shell {
            justify-content: center;
            align-items: center;
            padding-bottom: calc(18px + env(safe-area-inset-bottom, 0px));
          }
          .top-row {
            top: calc(14px + env(safe-area-inset-top, 0px));
          }
          .auth-panel {
            width: min(92vw, 420px);
            border-radius: 28px;
          }
        }
      `}</style>
    </div>
  );
}
