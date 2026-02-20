"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Inter, Playfair_Display } from "next/font/google";
import { Button } from "@/app/components/ui/Button";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

const revealCards = [
  {
    title: "Concierge Introductions",
    description: "Personal match curation designed around your lifestyle, values, and long-term intent.",
  },
  {
    title: "Private by Default",
    description: "Discretion-first profile controls with verification standards expected by high-net-worth members.",
  },
  {
    title: "Global Elite Network",
    description: "A refined community spanning major cities, private clubs, and executive travel corridors.",
  },
];

export default function HomePage() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".reveal-card"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      { threshold: 0.2 }
    );

    items.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`marketing-home ${inter.variable} ${playfair.variable}`}>
      <header className="main-header">
        <nav className="frosted-nav" aria-label="Primary navigation">
          <span className="brand">Elite Match</span>
          <Link href="/login" className="nav-link">
            Member Login
          </Link>
        </nav>
      </header>

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

      <section className="reveal-shell" aria-labelledby="why-elite-match-title">
        <div className="reveal-intro">
          <p className="hero-kicker">Why Elite Match</p>
          <h2 id="why-elite-match-title">Boutique service for exceptional outcomes.</h2>
        </div>
        <div className="reveal-grid">
          {revealCards.map((card, index) => (
            <article className="reveal-card" key={card.title} style={{ transitionDelay: `${index * 120}ms` }}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        .marketing-home {
          min-height: 100dvh;
          padding-bottom: env(safe-area-inset-bottom, 16px);
          background:
            linear-gradient(180deg, rgba(12, 11, 15, 0.42), rgba(8, 7, 10, 0.88)),
            url("https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1920&q=80") center / cover no-repeat fixed;
          color: #f3ece3;
          font-family: var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        :global([data-theme='light']) .marketing-home {
          background:
            linear-gradient(180deg, rgba(255, 254, 252, 0.72), rgba(245, 240, 233, 0.9)),
            radial-gradient(circle at 50% 10%, #fffefc 0%, #f5f0e9 100%);
          color: #2c2122;
        }

        .main-header {
          padding-top: env(safe-area-inset-top, 24px);
          position: sticky;
          top: 0;
          z-index: 20;
        }

        .frosted-nav {
          margin: 0 auto;
          width: min(1200px, calc(100% - 48px));
          min-height: 68px;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(13, 11, 16, 0.52);
          border: 0.5px solid rgba(212, 175, 55, 0.45);
          border-radius: 20px;
        }

        :global([data-theme='light']) .frosted-nav {
          background: rgba(255, 254, 252, 0.78);
          border-color: rgba(197, 131, 131, 0.5);
        }

        .brand {
          font-family: var(--font-playfair), "Playfair Display", Georgia, serif;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-size: 0.84rem;
        }

        .nav-link {
          font-size: 0.82rem;
          color: inherit;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
        }

        .hero-shell {
          min-height: 100dvh;
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
          display: grid;
          place-items: center;
          padding: 56px 0 96px;
        }

        .hero-copy {
          width: min(760px, 100%);
          text-align: center;
          animation: silkReveal 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .hero-kicker {
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 0.78rem;
          color: rgba(243, 236, 227, 0.72);
        }

        :global([data-theme='light']) .hero-kicker {
          color: rgba(44, 33, 34, 0.65);
        }

        .hero-copy h1 {
          margin: 0;
          font-family: var(--font-playfair), "Playfair Display", Georgia, serif;
          font-size: clamp(2.35rem, 7vw, 5.2rem);
          letter-spacing: 0.15em;
          line-height: 1.02;
          text-transform: uppercase;
        }

        .hero-subtitle {
          max-width: 640px;
          margin: 28px auto 0;
          font-size: clamp(1rem, 2.2vw, 1.2rem);
          line-height: 1.9;
          color: rgba(243, 236, 227, 0.8);
        }

        :global([data-theme='light']) .hero-subtitle {
          color: rgba(44, 33, 34, 0.78);
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
          border: 0.5px solid rgba(212, 175, 55, 0.58);
          background: linear-gradient(135deg, #d4af37 0%, #c58383 100%);
          color: #fff;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.26), 0 16px 28px rgba(20, 12, 16, 0.28);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .hero-actions :global(a:last-child button) {
          background: transparent;
          color: inherit;
          border-color: rgba(212, 175, 55, 0.4);
        }

        .hero-actions :global(button:hover) {
          box-shadow: inset 0 0 15px rgba(255, 255, 255, 0.2), 0 18px 30px rgba(20, 12, 16, 0.3);
        }

        .reveal-shell {
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
          padding: 0 0 96px;
        }

        .reveal-intro h2 {
          margin: 0;
          font-family: var(--font-playfair), "Playfair Display", Georgia, serif;
          letter-spacing: 0.08em;
          font-size: clamp(1.6rem, 5vw, 2.6rem);
          text-transform: uppercase;
        }

        .reveal-grid {
          margin-top: 30px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .reveal-card {
          padding: 24px;
          border-radius: 20px;
          border: 0.5px solid rgba(212, 175, 55, 0.55);
          background: rgba(18, 14, 20, 0.42);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          opacity: 0;
          transform: translateY(28px);
          transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        :global([data-theme='light']) .reveal-card {
          background: rgba(255, 254, 252, 0.72);
          border-color: rgba(197, 131, 131, 0.55);
        }

        .reveal-card.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .reveal-card h3 {
          margin: 0;
          font-family: var(--font-playfair), "Playfair Display", Georgia, serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .reveal-card p {
          margin: 14px 0 0;
          line-height: 1.8;
          color: rgba(243, 236, 227, 0.82);
        }

        :global([data-theme='light']) .reveal-card p {
          color: rgba(44, 33, 34, 0.78);
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

        @media (max-width: 900px) {
          .reveal-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 767px) {
          .frosted-nav,
          .hero-shell,
          .reveal-shell {
            width: calc(100% - 32px);
          }

          .hero-shell {
            padding: 40px 0 76px;
          }
        }
      `}</style>
    </div>
  );
}
