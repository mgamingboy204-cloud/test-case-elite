"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const DARK_IMAGE = "/icons/icon-512.png";
const LIGHT_IMAGE = "/icons/apple-touch-icon.png";

export default function AppGetStartedPage() {
  const router = useRouter();
  useEffect(() => {
    void router.prefetch("/app/login");
    void router.prefetch("/app/signup");
  }, [router]);

  return (
    <>
      <div className="app-get-started-shell" aria-label="Get started">
        <Image
          className="app-get-started-image app-get-started-image-dark"
          src={DARK_IMAGE}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
        />
        <Image
          className="app-get-started-image app-get-started-image-light"
          src={LIGHT_IMAGE}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
        />
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
      </div>

      <style jsx>{`
        .app-get-started-shell {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          overflow: hidden;
          display: grid;
          grid-template-rows: auto 1fr auto;
          padding: calc(16px + env(safe-area-inset-top, 0px)) calc(16px + env(safe-area-inset-right, 0px)) calc(16px + env(safe-area-inset-bottom, 0px)) calc(16px + env(safe-area-inset-left, 0px));
          isolation: isolate;
        }

        .app-get-started-image {
          object-fit: cover;
          object-position: center;
          transform: scale(1.03);
          filter: blur(1px) saturate(0.88) contrast(1.02);
        }

        .app-get-started-image-light {
          opacity: 0;
        }

        [data-theme="light"] .app-get-started-image-dark {
          opacity: 0;
        }

        [data-theme="light"] .app-get-started-image-light {
          opacity: 1;
          filter: blur(0.6px) saturate(0.9) brightness(1.08);
        }

        .app-get-started-overlay {
          position: absolute;
          inset: 0;
          z-index: 1;
          background:
            radial-gradient(65% 42% at 50% 44%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 78%),
            linear-gradient(180deg, rgba(10, 10, 14, 0.75) 0%, rgba(10, 10, 14, 0.38) 40%, rgba(10, 10, 14, 0.8) 100%);
        }

        [data-theme="light"] .app-get-started-overlay {
          background:
            radial-gradient(60% 40% at 50% 44%, color-mix(in srgb, var(--accent2) 16%, transparent), transparent 78%),
            linear-gradient(180deg, rgba(240, 236, 232, 0.66) 0%, rgba(246, 242, 236, 0.34) 40%, rgba(240, 234, 228, 0.72) 100%);
        }

        .app-get-started-top,
        .app-get-started-center,
        .app-get-started-actions {
          position: relative;
          z-index: 2;
          width: min(420px, 100%);
          margin: 0 auto;
        }

        .app-get-started-top {
          padding-top: 4px;
          color: color-mix(in srgb, var(--text) 86%, transparent);
          font-size: 0.95rem;
          font-weight: 600;
          letter-spacing: 0.03em;
        }

        .app-get-started-center {
          align-self: center;
          display: grid;
          gap: 10px;
        }

        .app-get-started-center h1 {
          margin: 0;
          color: var(--text);
          font-size: clamp(2rem, 7vw, 2.4rem);
          line-height: 1.1;
          font-weight: 650;
          letter-spacing: -0.01em;
          text-wrap: balance;
        }

        .app-get-started-center p {
          margin: 0;
          color: color-mix(in srgb, var(--text) 72%, transparent);
          font-size: 0.98rem;
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .app-get-started-actions {
          align-self: end;
          display: grid;
          gap: 10px;
        }

        .action-btn {
          min-height: 56px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          font-size: 1rem;
          font-weight: 600;
          transition: transform 150ms ease, opacity 150ms ease, background-color 150ms ease, border-color 150ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .action-btn:active {
          transform: scale(0.98);
        }

        .action-btn-primary {
          color: #fff9f7;
          background: linear-gradient(
            145deg,
            color-mix(in srgb, var(--accent) 92%, #cfab72 8%),
            color-mix(in srgb, var(--accent-deep) 78%, #a6844f 22%)
          );
          box-shadow: 0 14px 34px color-mix(in srgb, var(--accent) 28%, transparent);
        }

        [data-theme="light"] .action-btn-primary {
          color: color-mix(in srgb, #332714 82%, var(--text) 18%);
          background: linear-gradient(
            145deg,
            color-mix(in srgb, var(--accent2) 44%, #e3c38f 56%),
            color-mix(in srgb, var(--accent) 36%, #cfab72 64%)
          );
        }

        .action-btn-secondary {
          color: color-mix(in srgb, var(--text) 90%, transparent);
          background: color-mix(in srgb, var(--surface) 20%, transparent);
          border: 1px solid color-mix(in srgb, var(--text) 14%, transparent);
          backdrop-filter: blur(8px);
        }

        .terms-text {
          margin: 4px 6px 0;
          text-align: center;
          font-size: 0.76rem;
          line-height: 1.4;
          color: color-mix(in srgb, var(--text) 56%, transparent);
        }
      `}</style>
    </>
  );
}
