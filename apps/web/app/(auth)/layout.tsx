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
          background: linear-gradient(125deg, color-mix(in srgb, var(--bg) 88%, transparent), color-mix(in srgb, var(--surface) 76%, transparent));
          backdrop-filter: blur(2px);
        }
        .auth-vignette {
          background: radial-gradient(circle at center, transparent 38%, color-mix(in srgb, var(--bg) 66%, transparent) 100%);
        }
        .auth-glow-top {
          background: radial-gradient(circle at 18% 16%, var(--rose-glow-2), transparent 42%);
        }
        .auth-glow-bottom {
          background: radial-gradient(circle at 82% 84%, var(--rose-glow), transparent 40%);
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
          text-shadow: var(--shadow-sm);
        }
        .theme-btn {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid color-mix(in srgb, var(--accent) 42%, var(--border));
          background: color-mix(in srgb, var(--surface2) 76%, var(--pearl-panel));
          backdrop-filter: blur(16px);
          color: var(--text-secondary);
          box-shadow: var(--shadow-sm);
          display: grid;
          place-items: center;
        }
        .auth-panel {
          position: relative;
          z-index: 3;
          width: min(92vw, 430px);
          border-radius: 32px;
          border: 1px solid color-mix(in srgb, var(--border) 78%, var(--accent) 22%);
          background: linear-gradient(145deg, color-mix(in srgb, var(--surface) 86%, transparent), color-mix(in srgb, var(--surface2) 82%, var(--pearl-panel)));
          backdrop-filter: blur(24px);
          box-shadow: var(--shadow-md);
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
          background: linear-gradient(135deg, color-mix(in srgb, var(--surface) 90%, transparent), color-mix(in srgb, var(--surface2) 86%, transparent));
        }
        :global([data-theme='light']) .auth-vignette {
          background: radial-gradient(circle at center, transparent 42%, color-mix(in srgb, var(--surface2) 46%, transparent) 100%);
        }
        :global([data-theme='light']) .auth-glow-top {
          background: radial-gradient(circle at 14% 14%, var(--rose-glow-2), transparent 44%);
        }
        :global([data-theme='light']) .auth-glow-bottom {
          background: radial-gradient(circle at 80% 80%, var(--rose-glow), transparent 38%);
        }
        :global([data-theme='light']) .brand {
          color: var(--text);
          text-shadow: none;
        }
        :global([data-theme='light']) .theme-btn {
          color: var(--text-secondary);
          border-color: color-mix(in srgb, var(--accent) 36%, var(--border));
          background: color-mix(in srgb, var(--surface) 84%, transparent);
          box-shadow: var(--shadow-sm);
        }
        :global([data-theme='light']) .auth-panel {
          border-color: color-mix(in srgb, var(--accent) 30%, var(--border));
          background: linear-gradient(145deg, color-mix(in srgb, var(--surface) 90%, transparent), color-mix(in srgb, var(--surface2) 86%, transparent));
          box-shadow: var(--shadow-md);
        }
        @media (max-width: 900px) {
          .auth-shell {
            min-height: 100vh;
            min-height: 100svh;
            min-height: 100dvh;
            height: 100vh;
            height: 100svh;
            height: 100dvh;
            justify-content: flex-start;
            align-items: stretch;
            overflow: hidden;
            overscroll-behavior: none;
            padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
          }
          .top-row {
            top: calc(10px + env(safe-area-inset-top, 0px));
            left: calc(14px + env(safe-area-inset-left, 0px));
            right: calc(14px + env(safe-area-inset-right, 0px));
          }
          .auth-panel {
            width: 100%;
            max-width: none;
            margin-top: auto;
            border-radius: 28px 28px 0 0;
            border-bottom: none;
          }
        }
        @media (display-mode: standalone) and (max-width: 1024px) {
          .auth-shell {
            min-height: 100vh;
            min-height: 100svh;
            min-height: 100dvh;
            height: 100vh;
            height: 100svh;
            height: 100dvh;
            justify-content: flex-start;
            align-items: stretch;
            overflow: hidden;
            overscroll-behavior: none;
            padding: env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px);
          }
          .top-row {
            top: calc(10px + env(safe-area-inset-top, 0px));
            left: calc(14px + env(safe-area-inset-left, 0px));
            right: calc(14px + env(safe-area-inset-right, 0px));
          }
          .auth-panel {
            width: 100%;
            max-width: none;
            margin-top: auto;
            border-radius: 28px 28px 0 0;
            border-bottom: none;
          }
        }
      `}</style>
    </div>
  );
}
