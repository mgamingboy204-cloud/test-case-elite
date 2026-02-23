"use client";

import Link from "next/link";

export default function AppGetStartedPage() {
  return (
    <>
      <div className="app-get-started-shell" aria-label="Get started">
        <div className="app-get-started-overlay" />
        <div className="app-get-started-content">
          <h1>Start something epic.</h1>
          <div className="app-get-started-actions">
            <Link className="action-btn action-btn-primary" href="/signup">Create account</Link>
            <Link className="action-btn action-btn-secondary" href="/login">Sign in</Link>
          </div>
        </div>
      </div>
      <style jsx>{`
        .app-get-started-shell {
          position: relative;
          isolation: isolate;
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          align-items: flex-end;
          padding: calc(16px + env(safe-area-inset-top, 0px)) calc(16px + env(safe-area-inset-right, 0px)) calc(18px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-left, 0px));
          background-image: url('https://images.unsplash.com/photo-1499952127939-9bbf5af6c51c?auto=format&fit=crop&w=1400&q=80');
          background-size: cover;
          background-position: center;
        }

        .app-get-started-overlay {
          position: absolute;
          inset: 0;
          z-index: 0;
          background: linear-gradient(180deg, rgba(11, 16, 32, 0.08) 26%, rgba(8, 12, 24, 0.86) 78%, rgba(8, 12, 24, 0.96) 100%);
        }

        .app-get-started-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 380px;
          margin: 0 auto;
          display: grid;
          gap: 18px;
        }

        .app-get-started-content h1 {
          margin: 0;
          color: #f7f8fb;
          font-size: clamp(2rem, 7vw, 2.35rem);
          line-height: 1.12;
          font-weight: 800;
          letter-spacing: -0.01em;
          text-wrap: balance;
        }

        .app-get-started-actions {
          display: grid;
          gap: 10px;
        }

        .action-btn {
          min-height: 54px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          font-size: 1.05rem;
          font-weight: 700;
          text-decoration: none;
          border: 1px solid transparent;
          transition: transform 0.14s ease, opacity 0.14s ease;
        }

        .action-btn:active {
          transform: scale(0.985);
        }

        .action-btn-primary {
          background: #ffffff;
          color: #111827;
        }

        .action-btn-secondary {
          background: rgba(255, 255, 255, 0.14);
          border-color: rgba(255, 255, 255, 0.35);
          color: #ffffff;
          backdrop-filter: blur(6px);
        }
      `}</style>
    </>
  );
}
