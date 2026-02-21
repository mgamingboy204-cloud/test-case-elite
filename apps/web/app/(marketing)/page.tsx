"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { Button } from "@/app/components/ui/Button";

const revealCards = [
  { title: "Concierge Introductions", description: "Personal match curation designed around your lifestyle, values, and long-term intent." },
  { title: "Private by Default", description: "Discretion-first profile controls with verification standards expected by high-net-worth members." },
  { title: "Global Elite Network", description: "A refined community spanning major cities, private clubs, and executive travel corridors." }
];

export default function HomePage() {
  useEffect(() => {
    const items = Array.from(document.querySelectorAll<HTMLElement>(".reveal-card"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.2 }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="marketing-home">
      <section className="hero-shell" aria-labelledby="hero-title">
        <Image
          src="https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=2048&q=80"
          alt="Elegant couple at sunset"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <div className="hero-overlay" />
        <div className="hero-copy">
          <p className="hero-kicker">Invitation-only matchmaking</p>
          <h1 id="hero-title">START SOMETHING EPIC</h1>
          <p className="hero-subtitle">A private introduction service for discerning individuals who value elegance, discretion, and exceptional chemistry.</p>
          <div className="hero-actions">
            <Link href="/signup"><Button size="lg" className="marketing-rose-btn marketing-tap-target" style={{ borderRadius: 999, minHeight: 44, background: "var(--marketing-button-gradient)", boxShadow: "0 14px 30px rgba(255, 126, 179, 0.4)", border: "1px solid rgba(255,240,245,0.36)", color: "#fff" }}>Request Invitation</Button></Link>
            <Link href="/login"><Button size="lg" variant="secondary" className="marketing-tap-target" style={{ borderRadius: 999, minHeight: 44 }}>Existing Member</Button></Link>
          </div>
        </div>
      </section>

      <section className="reveal-shell" aria-labelledby="why-elite-match-title">
        <div className="reveal-intro">
          <p className="hero-kicker">Why Elite Match</p>
          <h2 id="why-elite-match-title">Boutique service for exceptional outcomes.</h2>
        </div>
        <div className="reveal-grid">
          {revealCards.map((card, index) => (
            <article className="reveal-card marketing-panel" key={card.title} style={{ transitionDelay: `${index * 120}ms` }}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        .marketing-home {
          min-height: 100dvh;
          font-family: var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background: linear-gradient(180deg, var(--marketing-bg-start), var(--marketing-bg-end));
          color: var(--marketing-text-strong);
        }
        .hero-shell {
          position: relative;
          min-height: 100dvh;
          width: min(1200px, calc(100% - 40px));
          margin: 0 auto;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 34px;
          box-shadow: 0 34px 72px rgba(8, 10, 16, 0.25);
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5));
        }
        .hero-copy {
          position: relative;
          z-index: 1;
          width: min(760px, 100%);
          text-align: center;
          padding: 40px 16px;
        }
        .hero-kicker { margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.24em; font-size: 0.78rem; color: rgba(255, 245, 238, 0.84); }
        .hero-copy h1 { margin: 0; font-family: var(--font-playfair), "Playfair Display", Georgia, serif; font-size: clamp(2.55rem, 7.2vw, 5.5rem); letter-spacing: -0.02em; line-height: 0.98; font-weight: 700; text-transform: uppercase; color: #fff; text-shadow: 0 10px 34px rgba(0, 0, 0, 0.56); }
        .hero-subtitle { max-width: 640px; margin: 24px auto 0; font-size: clamp(1rem, 2.2vw, 1.2rem); line-height: 1.8; color: rgba(255, 245, 238, 0.94); }
        .hero-actions { margin-top: 36px; display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; }
        .hero-actions :global(button) { min-width: 210px; transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out; }
        .hero-actions :global(button:hover) { transform: translateY(-1px) scale(1.01); box-shadow: 0 16px 40px rgba(13, 10, 12, 0.34); }
        .reveal-shell { width: min(1200px, calc(100% - 40px)); margin: 0 auto; padding: 44px 0 110px; }
        .reveal-intro h2 { margin: 0; font-family: var(--font-playfair), "Playfair Display", Georgia, serif; letter-spacing: 0.08em; font-size: clamp(1.6rem, 5vw, 2.6rem); text-transform: uppercase; }
        .reveal-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .reveal-card { padding: 28px; opacity: 0; transform: translateY(24px); transition: opacity 0.8s ease, transform 0.8s ease; }
        .reveal-card.is-visible { opacity: 1; transform: translateY(0); }
        .reveal-card h3 { margin: 0; font-family: var(--font-playfair), "Playfair Display", Georgia, serif; letter-spacing: 0.08em; text-transform: uppercase; }
        .reveal-card p { margin: 14px 0 0; line-height: 1.8; color: var(--marketing-text-muted); }
        @media (max-width: 900px) { .reveal-grid { grid-template-columns: 1fr; } }
        @media (max-width: 767px) {
          .hero-shell, .reveal-shell { width: calc(100% - 20px); }
          .hero-shell { border-radius: 22px; }
        }
      `}</style>
    </div>
  );
}
