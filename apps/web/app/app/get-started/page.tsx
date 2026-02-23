"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

const BACKGROUND_IMAGES = [
  "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1440&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1440&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1440&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1440&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1440&q=80",
] as const;

export default function AppGetStartedPage() {
  const router = useRouter();
  const backgroundImage = useMemo(() => {
    const imageIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
    return BACKGROUND_IMAGES[imageIndex] ?? BACKGROUND_IMAGES[0];
  }, []);

  useEffect(() => {
    void router.prefetch("/app/login");
    void router.prefetch("/signup");
  }, [router]);

  return (
    <>
      <main className="app-get-started-shell" aria-label="Get started">
        <img className="app-get-started-image" src={backgroundImage} alt="" aria-hidden="true" />
        <div className="app-get-started-overlay" aria-hidden="true" />

        <header className="app-get-started-top">Elite Match</header>

        <section className="app-get-started-center">
          <h1>Start something epic.</h1>
          <p>Private. Curated. Exceptional.</p>
        </section>

        <section className="app-get-started-actions" aria-label="Get started actions">
          <Link className="action-btn action-btn-primary" href="/signup">
            Create account
          </Link>
          <Link className="action-btn action-btn-secondary" href="/app/login">
            I have an account
          </Link>
          <p className="terms-text">By continuing, you agree to our Terms &amp; Privacy Policy.</p>
        </section>
      </main>

      <style jsx>{`
        .app-get-started-shell {
          position: relative;
          min-height: 100dvh;
          display: grid;
          grid-template-rows: auto 1fr auto;
          overflow: hidden;
          padding: calc(18px + env(safe-area-inset-top, 0px)) calc(20px + env(safe-area-inset-right, 0px)) calc(24px + env(safe-area-inset-bottom, 0px)) calc(20px + env(safe-area-inset-left, 0px));
          isolation: isolate;
        }

        .app-get-started-image {
          position: fixed;
          inset: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.03);
          filter: blur(8px) saturate(1.05);
          opacity: 0.95;
          pointer-events: none;
        }

        .app-get-started-overlay {
          position: fixed;
          inset: 0;
          z-index: 1;
          background:
            radial-gradient(circle at center, transparent 20%, rgba(0, 0, 0, 0.55) 100%),
            linear-gradient(180deg, rgba(0, 0, 0, 0.65) 0%, rgba(0, 0, 0, 0.35) 45%, rgba(0, 0, 0, 0.75) 100%);
          pointer-events: none;
        }

        [data-theme="light"] .app-get-started-overlay {
          background:
            radial-gradient(circle at center, transparent 22%, rgba(0, 0, 0, 0.38) 100%),
            linear-gradient(180deg, rgba(255, 255, 255, 0.28) 0%, rgba(0, 0, 0, 0.2) 48%, rgba(0, 0, 0, 0.56) 100%);
        }

        .app-get-started-top,
        .app-get-started-center,
        .app-get-started-actions {
          position: relative;
          z-index: 2;
          width: min(420px, 100%);
        }

        .app-get-started-top {
          color: rgba(255, 255, 255, 0.85);
          font-size: clamp(0.88rem, 2.8vw, 1rem);
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .app-get-started-center {
          align-self: center;
          display: grid;
          gap: 12px;
        }

        .app-get-started-center h1 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(2.65rem, 11vw, 3.25rem);
          line-height: 1.06;
          letter-spacing: -0.025em;
          font-weight: 650;
        }

        .app-get-started-center p {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: clamp(1rem, 3.4vw, 1.12rem);
          line-height: 1.35;
          font-weight: 500;
        }

        .app-get-started-actions {
          align-self: end;
          display: grid;
          gap: 10px;
        }

        .action-btn {
          min-height: 54px;
          border-radius: 17px;
          display: grid;
          place-items: center;
          font-size: 1rem;
          font-weight: 600;
          text-decoration: none;
          transition: transform 150ms ease, opacity 150ms ease, background-color 150ms ease, border-color 150ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .action-btn:active {
          transform: scale(0.98);
        }

        .action-btn-primary {
          color: #111;
          background: linear-gradient(170deg, rgba(255, 255, 255, 0.96) 0%, rgba(242, 242, 242, 0.92) 100%);
        }

        .action-btn-secondary {
          color: rgba(255, 255, 255, 0.94);
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.28);
          backdrop-filter: blur(8px);
        }

        [data-theme="light"] .app-get-started-top {
          color: rgba(255, 255, 255, 0.92);
        }

        [data-theme="light"] .action-btn-primary {
          color: #111;
          background: linear-gradient(170deg, rgba(255, 255, 255, 0.98) 0%, rgba(245, 245, 245, 0.93) 100%);
        }

        .terms-text {
          margin: 6px 4px 0;
          text-align: center;
          font-size: clamp(0.76rem, 2.9vw, 0.82rem);
          line-height: 1.4;
          color: rgba(255, 255, 255, 0.62);
        }
      `}</style>
    </>
  );
}
