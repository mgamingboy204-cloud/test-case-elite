"use client";

import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";
import { Button } from "@/app/components/ui/Button";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export default function HomePage() {
  return (
    <div className={`marketing-home ${inter.variable} ${playfair.variable}`}>
      <nav className="frosted-nav" aria-label="Primary navigation">
        <span className="brand">Elite Match</span>
        <Link href="/login" className="nav-link">
          Member Login
        </Link>
      </nav>

      <main className="hero-shell">
        <section className="hero-copy" aria-labelledby="hero-title">
          <p className="hero-kicker">Invitation-only matchmaking</p>
          <h1 id="hero-title">Start something epic.</h1>
          <p className="hero-subtitle">
            A private introduction service for discerning individuals who value elegance, discretion, and exceptional chemistry.
          </p>

          <div className="hero-actions">
            <Link href="/signup">
              <Button size="lg" style={{ borderRadius: 999 }}>
                Request Invitation
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary" style={{ borderRadius: 999 }}>
                Existing Member
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <style jsx>{`
        .marketing-home {
          min-height: 100vh;
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          background: radial-gradient(circle at 50% 50%, #fffefc 0%, #f5f0e9 100%);
          color: #221c1e;
          font-family: var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        :global([data-theme='dark']) .marketing-home {
          background: radial-gradient(circle at 50% 10%, #1f1a1e 0%, #110e12 100%);
          color: #efe8e2;
        }

        .frosted-nav {
          position: sticky;
          top: 0;
          z-index: 10;
          margin: 0 auto;
          width: min(1200px, calc(100% - 48px));
          min-height: 74px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(255, 254, 252, 0.66);
          border-bottom: 0.5px solid rgba(183, 110, 121, 0.6);
          transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        :global([data-theme='dark']) .frosted-nav {
          background: rgba(20, 16, 20, 0.72);
        }

        .brand {
          font-family: var(--font-playfair), "Playfair Display", Georgia, serif;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-size: 0.84rem;
        }

        .nav-link {
          font-size: 0.88rem;
          color: inherit;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .hero-shell {
          min-height: calc(100vh - 74px);
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
          display: grid;
          place-items: center;
          padding: 64px 0 80px;
        }

        .hero-copy {
          width: min(760px, 100%);
          text-align: center;
          animation: silkReveal 1.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .hero-kicker {
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 0.78rem;
          color: rgba(34, 28, 30, 0.68);
        }

        :global([data-theme='dark']) .hero-kicker {
          color: rgba(239, 232, 226, 0.68);
        }

        .hero-copy h1 {
          margin: 0;
          font-family: var(--font-playfair), "Playfair Display", Georgia, serif;
          font-size: clamp(2.3rem, 7vw, 5rem);
          letter-spacing: 0.15em;
          line-height: 1.04;
          text-transform: uppercase;
        }

        .hero-subtitle {
          max-width: 640px;
          margin: 28px auto 0;
          font-size: clamp(1rem, 2.2vw, 1.2rem);
          line-height: 1.9;
          color: rgba(34, 28, 30, 0.76);
        }

        :global([data-theme='dark']) .hero-subtitle {
          color: rgba(239, 232, 226, 0.74);
        }

        .hero-actions {
          margin-top: 44px;
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .hero-actions :global(button) {
          min-width: 210px;
          min-height: 52px;
          border: 0.5px solid rgba(183, 110, 121, 0.6);
          background: linear-gradient(180deg, #b76e79 0%, #91545d 100%);
          color: #fff;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 14px 28px rgba(130, 71, 79, 0.22);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .hero-actions :global(a:last-child button) {
          background: transparent;
          color: inherit;
        }

        .hero-actions :global(button:hover) {
          box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.3), 0 14px 28px rgba(130, 71, 79, 0.24);
        }

        @keyframes silkReveal {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 767px) {
          .frosted-nav,
          .hero-shell {
            width: calc(100% - 48px);
          }

          .frosted-nav {
            padding: 14px 20px;
          }

          .hero-shell {
            padding: 48px 0 64px;
          }
        }
      `}</style>
    </div>
  );
}
