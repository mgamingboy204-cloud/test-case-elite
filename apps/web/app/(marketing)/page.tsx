"use client";

import Link from "next/link";

const featureCards = [
  {
    title: "Concierge Introductions",
    description: "Personal match curation designed around your lifestyle, values, and long-term intent."
  },
  {
    title: "Private by Default",
    description: "Discretion-first profile controls with verification standards expected by high-net-worth members."
  },
  {
    title: "Global Elite Network",
    description: "A refined community spanning major cities, private clubs, and executive travel corridors."
  }
];

export default function HomePage() {
  return (
    <div className="marketing-home">
      <div className="bg-layer" />
      <div className="overlay-layer" />

      <section className="hero" aria-labelledby="hero-title">
        <p className="kicker">Invitation-only matchmaking</p>
        <h1 id="hero-title">
          START
          <br />
          SOMETHING
          <br />
          EPIC.
        </h1>
        <p className="subtitle">
          A private introduction service for discerning individuals who value elegance, discretion, and exceptional chemistry.
        </p>
        <div className="hero-actions">
          <Link href="/signup" className="cta cta-primary marketing-tap-target">
            Request Invitation
          </Link>
          <Link href="/login" className="cta cta-secondary marketing-tap-target">
            Existing Member
          </Link>
        </div>
      </section>

      <section className="why" aria-labelledby="why-title">
        <p className="kicker">Why Elite Match</p>
        <h2 id="why-title">Boutique service for exceptional outcomes.</h2>
        <div className="feature-grid">
          {featureCards.map((card) => (
            <article key={card.title} className="feature-card">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        .marketing-home {
          position: relative;
          min-height: 100dvh;
          color: #f4f2ef;
          padding: clamp(112px, 14vw, 150px) 24px 0;
          display: flex;
          flex-direction: column;
          isolation: isolate;
        }
        .bg-layer,
        .overlay-layer {
          position: fixed;
          inset: 0;
          z-index: -2;
        }
        .bg-layer {
          background-image: url('https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2200&q=80');
          background-size: cover;
          background-position: center;
          transform: scale(1.02);
        }
        .overlay-layer {
          z-index: -1;
          background: linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.3));
        }
        .hero {
          width: min(860px, 100%);
          margin: 0 auto;
          text-align: center;
        }
        .kicker {
          text-transform: uppercase;
          letter-spacing: 0.22em;
          font-size: 0.84rem;
          color: rgba(247, 244, 241, 0.82);
          margin: 0 0 20px;
        }
        h1 {
          margin: 0;
          font-family: var(--font-playfair), "Playfair Display", Georgia, serif;
          font-size: clamp(3.1rem, 8.9vw, 7.6rem);
          line-height: 1.1;
          letter-spacing: -0.02em;
          font-weight: 700;
          color: #fff;
        }
        .subtitle {
          max-width: 820px;
          margin: 28px auto 0;
          font-size: clamp(1.2rem, 2.2vw, 2rem);
          line-height: 1.5;
          color: rgba(248, 245, 242, 0.9);
        }
        .hero-actions {
          margin-top: 38px;
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .cta {
          min-width: 270px;
          min-height: 62px;
          padding: 0 34px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.02em;
          font-size: 1.06rem;
          border: 1px solid transparent;
        }
        .cta-primary {
          background: linear-gradient(135deg, #FF758C 0%, #FF7EB3 100%);
          color: #fff;
          box-shadow: 0 10px 20px rgba(255, 126, 179, 0.4);
        }
        .cta-secondary {
          background: rgba(15, 23, 44, 0.93);
          color: #f6f4f1;
          border-color: rgba(255, 255, 255, 0.1);
        }
        .why {
          width: min(1360px, 100%);
          margin: auto auto 0;
          padding: clamp(70px, 10vw, 130px) 0 110px;
        }
        h2 {
          margin: 0;
          font-family: var(--font-playfair), "Playfair Display", Georgia, serif;
          color: #fff;
          text-transform: uppercase;
          font-size: clamp(2.2rem, 4.7vw, 5.3rem);
          line-height: 1.04;
          max-width: 1220px;
        }
        .feature-grid {
          margin-top: 32px;
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .feature-card {
          border-radius: 22px;
          background: rgba(9, 16, 34, 0.72);
          border: 1px solid rgba(255, 255, 255, 0.22);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          padding: clamp(24px, 2.4vw, 34px);
          box-shadow: 0 20px 48px rgba(6, 8, 15, 0.34);
        }
        .feature-card h3 {
          margin: 0;
          color: #fff;
          text-transform: uppercase;
          font-family: var(--font-playfair), "Playfair Display", Georgia, serif;
          font-size: clamp(1.65rem, 2.4vw, 3rem);
          line-height: 1.06;
          letter-spacing: 0.02em;
        }
        .feature-card p {
          margin: 18px 0 0;
          font-size: clamp(1.02rem, 1.45vw, 1.18rem);
          line-height: 1.6;
          color: rgba(241, 238, 232, 0.86);
        }
        @media (max-width: 1100px) {
          .feature-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
