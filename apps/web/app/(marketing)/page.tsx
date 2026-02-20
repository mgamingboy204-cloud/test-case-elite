"use client";

import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/Button";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

const whyCards = [
  {
    title: "Curated Introductions",
    description: "Every introduction is hand-screened to align values, lifestyle, and long-term intent.",
  },
  {
    title: "Discreet by Design",
    description: "Private profiles, concierge moderation, and selective visibility for total peace of mind.",
  },
  {
    title: "White-Glove Service",
    description: "From first match to first date, every touchpoint is crafted with boutique hospitality.",
  },
];

export default function HomePage() {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const section = document.getElementById("why-elite-match");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={`marketing-home ${inter.variable} ${playfair.variable}`}>
      <header className="header-shell">
        <nav className="pearl-nav" aria-label="Primary navigation">
          <span className="brand">Elite Match</span>
          <Link href="/login" className="nav-link">
            Member Login
          </Link>
        </nav>
      </header>

      <main>
        <section className="hero-shell" aria-labelledby="hero-title">
          <div className="hero-overlay" />

          <div className="hero-copy">
            <p className="hero-kicker">Invitation-only matchmaking</p>
            <h1 id="hero-title">Start something epic.</h1>
            <p className="hero-subtitle">
              A private relationship house for Ultra-High-Net-Worth individuals who expect elegance, discretion, and rare compatibility.
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
          </div>
        </section>

        <section id="why-elite-match" className={`why-shell ${revealed ? "revealed" : ""}`}>
          <h2>Why Elite Match</h2>
          <div className="why-grid">
            {whyCards.map((card, index) => (
              <article key={card.title} className="why-card" style={{ transitionDelay: `${index * 140}ms` }}>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <style jsx>{`
        .marketing-home {
          min-height: 100vh;
          background: radial-gradient(circle at 50% 50%, #fffefc 0%, #f5f0e9 100%);
          color: #fffefc;
          font-family: var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        :global([data-theme='dark']) .marketing-home {
          background: radial-gradient(circle at 50% 10%, #1f1a1e 0%, #110e12 100%);
        }

        .header-shell {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 20;
          display: flex;
          justify-content: center;
          padding-top: env(safe-area-inset-top);
          pointer-events: none;
        }

        .pearl-nav {
          pointer-events: auto;
          margin: 12px 24px 0;
          width: min(980px, calc(100% - 48px));
          min-height: 64px;
          padding: 14px 22px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-radius: 50px;
          background: rgba(255, 254, 252, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 0.5px solid rgba(183, 110, 121, 0.58);
          transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .brand {
          color: #211a1c;
          font-family: var(--font-playfair), "Playfair Display", Georgia, serif;
          letter-spacing: 0.15em;
          font-size: 0.76rem;
          text-transform: uppercase;
        }

        .nav-link {
          color: #211a1c;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: 0.78rem;
        }

        .hero-shell {
          position: relative;
          min-height: 100dvh;
          padding: calc(92px + env(safe-area-inset-top)) 24px calc(44px + env(safe-area-inset-bottom));
          display: grid;
          align-items: end;
          justify-items: center;
          background-image: url("https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2000&q=80");
          background-size: cover;
          background-position: center;
          overflow: hidden;
        }

        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.1));
        }

        .hero-copy {
          position: relative;
          z-index: 1;
          width: min(760px, 100%);
          text-align: center;
          animation: silkReveal 1.4s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .hero-kicker {
          margin: 0 0 18px;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 0.75rem;
          color: rgba(255, 254, 252, 0.88);
        }

        .hero-copy h1 {
          margin: 0;
          font-family: var(--font-playfair), "Playfair Display", Georgia, serif;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-size: clamp(2.1rem, 9vw, 5rem);
          line-height: 1.08;
        }

        .hero-subtitle {
          margin: 22px auto 0;
          max-width: 650px;
          line-height: 1.8;
          font-size: clamp(1rem, 2.6vw, 1.18rem);
          color: rgba(255, 254, 252, 0.9);
        }

        .hero-actions {
          margin-top: 34px;
          display: flex;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .hero-actions :global(button) {
          min-width: 210px;
          min-height: 52px;
          border: 0.5px solid rgba(183, 110, 121, 0.88);
          background: linear-gradient(180deg, #b76e79 0%, #91545d 100%);
          color: #fff;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 14px 28px rgba(130, 71, 79, 0.24);
          transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .hero-actions :global(a:last-child button) {
          background: rgba(11, 11, 11, 0.36);
          border-color: rgba(255, 254, 252, 0.7);
        }

        .hero-actions :global(button:hover) {
          box-shadow: inset 0 0 12px rgba(255, 255, 255, 0.3), 0 14px 28px rgba(130, 71, 79, 0.26);
        }

        .why-shell {
          padding: 72px 24px calc(88px + env(safe-area-inset-bottom));
          background: radial-gradient(circle at 50% 0%, #f6f1ea 0%, #ede6dd 100%);
        }

        :global([data-theme='dark']) .why-shell {
          background: radial-gradient(circle at 50% 0%, #1e181d 0%, #121014 100%);
        }

        .why-shell h2 {
          margin: 0;
          text-align: center;
          color: #231d20;
          font-family: var(--font-playfair), "Playfair Display", Georgia, serif;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          font-size: clamp(1.35rem, 4vw, 2.1rem);
        }

        :global([data-theme='dark']) .why-shell h2 {
          color: #f1eae4;
        }

        .why-grid {
          margin: 34px auto 0;
          width: min(980px, 100%);
          display: grid;
          gap: 14px;
          grid-template-columns: repeat(1, minmax(0, 1fr));
        }

        .why-card {
          background: #0b0b0b;
          border: 0.5px solid rgba(183, 110, 121, 0.65);
          border-radius: 20px;
          padding: 22px;
          transform: translateY(48px);
          opacity: 0;
          transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.8s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .why-shell.revealed .why-card {
          transform: translateY(0);
          opacity: 1;
        }

        .why-card h3 {
          margin: 0;
          color: #fffefc;
          font-family: var(--font-playfair), "Playfair Display", Georgia, serif;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 1rem;
        }

        .why-card p {
          margin: 10px 0 0;
          color: rgba(255, 254, 252, 0.82);
          line-height: 1.75;
          font-size: 0.96rem;
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

        @media (min-width: 900px) {
          .hero-shell {
            padding-left: 32px;
            padding-right: 32px;
          }

          .why-shell {
            padding-left: 32px;
            padding-right: 32px;
          }

          .why-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  );
}
