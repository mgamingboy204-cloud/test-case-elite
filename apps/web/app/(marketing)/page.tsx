"use client";

import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";

const featureCards = [
  {
    title: "CONCIERGE INTRODUCTIONS",
    description: "Personal match curation guided by your values, pace, and the kind of life you are building."
  },
  {
    title: "PRIVATE BY DEFAULT",
    description: "Discretion-first profiles, selective visibility, and trusted member verification throughout the journey."
  },
  {
    title: "GLOBAL ELITE NETWORK",
    description: "A refined network across major cities, private clubs, and executive travel routes."
  }
];

export default function HomePage() {
  const [x, setX] = useState(50);
  const [y, setY] = useState(50);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const updateMouse = (event: MouseEvent) => {
      const nextX = (event.clientX / window.innerWidth) * 100;
      const nextY = (event.clientY / window.innerHeight) * 100;
      setX(nextX);
      setY(nextY);
    };

    window.addEventListener("mousemove", updateMouse, { passive: true });
    return () => window.removeEventListener("mousemove", updateMouse);
  }, []);

  return (
    <div className="home-page">
      <section className="hero-wrap" aria-labelledby="hero-title">
        <div className="hero-bg" style={{ "--mx": `${x}%`, "--my": `${y}%` } as CSSProperties} />
        <div className="hero-noise" aria-hidden />
        <div className="hero-content">
          <p className="hero-kicker">INVITATION-ONLY MATCHMAKING</p>
          <h1 id="hero-title">
            <span>START</span>
            <span>SOMETHING</span>
            <span>EPIC.</span>
          </h1>
          <p className="hero-subtext">
            A private introduction service for discerning members who value elegance, discretion, and exceptional chemistry.
          </p>
          <div className="hero-actions">
            <Link href="/signup" className="cta cta-primary">REQUEST INVITATION</Link>
            <Link href="/login" className="cta cta-secondary">EXISTING MEMBER</Link>
          </div>
        </div>
      </section>

      <section className="feature-section" aria-labelledby="feature-title">
        <p className="feature-kicker">WHY ELITE MATCH</p>
        <h2 id="feature-title">BOUTIQUE SERVICE FOR EXCEPTIONAL OUTCOMES.</h2>

        <div className="feature-grid">
          {featureCards.map((card) => (
            <article className="feature-card marketing-panel marketing-interactive" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        .home-page {
          min-height: 100dvh;
          background:
            radial-gradient(1200px 650px at 50% -80px, rgba(244, 114, 182, 0.15), transparent 70%),
            linear-gradient(180deg, var(--marketing-bg-start), var(--marketing-bg-end));
          color: var(--marketing-text-strong);
          padding: clamp(78px, 12vw, 110px) 12px 58px;
        }

        .hero-wrap {
          width: min(1220px, 100%);
          min-height: clamp(560px, 90vh, 820px);
          margin: 0 auto;
          border-radius: clamp(26px, 3.8vw, 42px);
          overflow: hidden;
          position: relative;
          display: grid;
          place-items: center;
          box-shadow: 0 30px 90px rgba(15, 23, 42, 0.28);
          border: 1px solid var(--marketing-glass-border);
        }

        .hero-bg {
          position: absolute;
          inset: -8%;
          background:
            radial-gradient(72% 78% at var(--mx) var(--my), rgba(103, 232, 249, 0.45), transparent 58%),
            radial-gradient(70% 84% at 20% 84%, rgba(253, 186, 116, 0.66), transparent 62%),
            radial-gradient(72% 82% at 78% 22%, rgba(59, 130, 246, 0.46), transparent 64%),
            linear-gradient(135deg, #082f49, #1e3a8a 44%, #0f172a 85%);
          transform: scale(1.04);
          animation: floatBg 12s ease-in-out infinite alternate;
          filter: saturate(108%) blur(2px);
        }

        .hero-wrap::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(2, 6, 23, 0.18), rgba(2, 6, 23, 0.55));
          z-index: 1;
        }

        .hero-noise {
          position: absolute;
          inset: 0;
          z-index: 1;
          background-image: radial-gradient(rgba(255, 255, 255, 0.06) 0.5px, transparent 0.5px);
          background-size: 3px 3px;
          opacity: 0.2;
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          width: min(860px, 100%);
          padding: 36px 20px;
          animation: contentRise 820ms ease forwards;
        }

        .hero-kicker {
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.82);
          margin-bottom: 16px;
        }

        h1 {
          margin: 0;
          display: grid;
          gap: 0.1em;
          justify-items: center;
          font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Times New Roman", serif;
          text-transform: uppercase;
          letter-spacing: 0.13em;
          line-height: 0.95;
          text-wrap: balance;
          font-size: clamp(2.2rem, 10.8vw, 7.2rem);
          color: #fff;
          text-shadow: 0 8px 25px rgba(2, 6, 23, 0.52);
        }

        .hero-subtext {
          margin: 28px auto 0;
          max-width: 700px;
          color: rgba(255, 255, 255, 0.9);
          line-height: 1.75;
          font-size: clamp(0.98rem, 2.5vw, 1.2rem);
        }

        .hero-actions {
          margin-top: 34px;
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        :global(.cta) {
          height: 56px;
          min-width: 282px;
          border-radius: 9999px;
          padding: 0 40px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease, filter 220ms ease, background-color 220ms ease;
          will-change: transform;
        }

        :global(.cta):focus-visible {
          outline: none;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9), 0 0 0 5px rgba(244, 63, 94, 0.45);
        }

        :global(.cta):hover { transform: translateY(-2px); }
        :global(.cta):active { transform: translateY(1px); }

        :global(.cta-primary) {
          color: #fff;
          background: linear-gradient(120deg, #ff5f6d, #ff455a);
          box-shadow: 0 14px 32px rgba(255, 77, 94, 0.35);
        }

        :global(.cta-primary):hover {
          filter: brightness(1.08);
          box-shadow: 0 16px 34px rgba(255, 77, 94, 0.45);
        }

        :global(.cta-primary):active {
          box-shadow: 0 9px 18px rgba(255, 77, 94, 0.28);
        }

        :global(.cta-secondary) {
          color: #fff;
          border: 1px solid rgba(148, 163, 184, 0.54);
          background: rgba(15, 23, 42, 0.82);
          box-shadow: 0 12px 28px rgba(2, 6, 23, 0.34);
          backdrop-filter: blur(6px);
        }

        :global(html.dark .cta-secondary) {
          border-color: rgba(255, 255, 255, 0.24);
          background: rgba(15, 23, 42, 0.76);
        }

        :global(.cta-secondary):hover {
          border-color: rgba(226, 232, 240, 0.82);
          box-shadow: 0 15px 31px rgba(2, 6, 23, 0.38);
        }

        :global(.cta-secondary):active {
          box-shadow: 0 9px 18px rgba(2, 6, 23, 0.28);
        }

        .feature-section {
          width: min(1220px, 100%);
          margin: 38px auto 0;
        }

        .feature-kicker {
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.74rem;
          color: var(--marketing-text-muted);
        }

        h2 {
          text-align: center;
          margin: 12px auto 0;
          max-width: 900px;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          line-height: 1.08;
          font-size: clamp(1.7rem, 5.1vw, 3.7rem);
          font-family: "Iowan Old Style", "Palatino Linotype", Palatino, "Times New Roman", serif;
        }

        .feature-grid {
          margin-top: 24px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .feature-card {
          border-radius: 28px;
          padding: 24px;
          min-height: 225px;
          transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(244, 114, 182, 0.58);
          box-shadow: 0 22px 42px rgba(15, 23, 42, 0.22);
        }

        .feature-card h3 {
          margin: 0;
          font-size: 1.03rem;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          line-height: 1.35;
        }

        .feature-card p {
          margin-top: 14px;
          color: var(--marketing-text-muted);
          line-height: 1.75;
          font-size: 0.98rem;
        }

        @media (max-width: 768px) {
          .home-page { padding-left: 10px; padding-right: 10px; }
          .hero-wrap { min-height: 76dvh; }
          .feature-grid { grid-template-columns: 1fr; }
          .feature-card { min-height: 190px; }
        }

        @media (max-width: 479px) {
          .hero-actions {
            width: min(92vw, 360px);
            margin-left: auto;
            margin-right: auto;
            flex-direction: column;
            align-items: stretch;
          }

          :global(.cta) {
            width: 100%;
            min-width: 0;
            height: 52px;
            padding: 0 32px;
          }
        }

        @keyframes contentRise {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes floatBg {
          from { transform: scale(1.04) translate3d(-0.6%, -0.35%, 0); }
          to { transform: scale(1.08) translate3d(0.6%, 0.35%, 0); }
        }

        @media (prefers-reduced-motion: reduce) {

           .hero-bg, .hero-content, .feature-card { animation: none; transition: none; }
          :global(.cta) { transition: border-color 220ms ease, box-shadow 220ms ease, filter 220ms ease, background-color 220ms ease; }
          :global(.cta:hover), :global(.cta:active) { transform: none; }
        }
      `}</style>
    </div>
  );
}
