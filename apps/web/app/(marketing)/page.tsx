"use client";

import Link from "next/link";
import { type MouseEvent, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/Button";

const heroStatements = [
  "Video-verified people, every single profile.",
  "Curated introductions built for real compatibility.",
  "Premium privacy and safety at every step.",
];

const chips = [
  { value: "50K+", label: "Verified Members" },
  { value: "12K+", label: "Meaningful Matches" },
];

function TiltCard({ text, className }: { text: string; className?: string }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const transform = useMemo(
    () => `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    [tilt.x, tilt.y],
  );

  const onMove = (event: MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setTilt({ x: (0.5 - py) * 12, y: (px - 0.5) * 12 });
  };

  return (
    <div
      className={`hero-card ${className ?? ""}`}
      style={{ transform }}
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
    >
      <p>{text}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="marketing-home">
      <section className="hero-shell">
        <div className="hero-overlay" />

        <div className="hero-copy">
          <p className="hero-kicker">Elite Match</p>
          <h1>Start something epic.</h1>
          <p className="hero-subtitle">
            A premium dating experience for people who value intention, trust, and depth.
          </p>

          <div className="desktop-cta">
            <Link href="/signup">
              <Button
                size="lg"
                style={{ borderRadius: 999, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 20px 40px rgba(230,57,70,0.35)" }}
              >
                Create Account
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary" style={{ borderRadius: 999 }}>
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        <div className="chip-bar">
          {chips.map((chip) => (
            <div key={chip.label} className="chip">
              <span>{chip.value}</span>
              <small>{chip.label}</small>
            </div>
          ))}
        </div>

        <div className="hero-stack" role="presentation">
          {heroStatements.map((statement, index) => (
            <TiltCard key={statement} text={statement} className={`stack-${index + 1}`} />
          ))}
        </div>

        <div className="mobile-actions safe-bottom">
          <Link href="/signup">
            <Button fullWidth size="lg" style={{ borderRadius: 999 }}>
              Get Started
            </Button>
          </Link>
          <Link href="/login">
            <Button fullWidth size="lg" variant="secondary" style={{ borderRadius: 999 }}>
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      <style jsx>{`
        .marketing-home {
          min-height: 100dvh;
          background: var(--bg);
          color: var(--text);
        }
        .hero-shell {
          position: relative;
          min-height: 100dvh;
          padding: 24px;
          background-image: url('https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=2200&q=80');
          background-size: cover;
          background-position: center;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 52% 125%, rgba(0, 0, 0, 0.96), rgba(0, 0, 0, 0.66) 45%, rgba(0, 0, 0, 0.78));
        }
        .hero-copy {
          position: relative;
          z-index: 2;
          margin-bottom: 130px;
          max-width: 620px;
        }
        .hero-kicker {
          font-size: 12px;
          letter-spacing: 0.3em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.84);
          margin-bottom: 12px;
        }
        .hero-copy h1 {
          font-size: clamp(2.2rem, 8vw, 5.4rem);
          color: #fff;
          line-height: 0.94;
          letter-spacing: -0.04em;
          font-weight: 800;
        }
        .hero-subtitle {
          margin-top: 18px;
          font-size: clamp(1rem, 2.3vw, 1.3rem);
          color: rgba(255, 255, 255, 0.92);
          max-width: 560px;
        }
        .desktop-cta {
          display: flex;
          gap: 12px;
          margin-top: 28px;
        }
        .chip-bar {
          position: absolute;
          z-index: 2;
          left: 24px;
          right: 24px;
          bottom: 112px;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .chip {
          border-radius: 999px;
          padding: 10px 14px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.07);
          backdrop-filter: blur(15px);
          display: inline-flex;
          align-items: baseline;
          gap: 8px;
        }
        .chip span {
          color: #fff;
          font-size: 1rem;
          font-weight: 800;
        }
        .chip small {
          color: rgba(255, 255, 255, 0.82);
          font-size: 0.75rem;
        }
        .hero-stack {
          position: absolute;
          right: 4%;
          top: 22%;
          width: min(480px, 44vw);
          z-index: 2;
          display: none;
        }
        .hero-card {
          border-radius: 24px;
          padding: 22px;
          margin-bottom: 14px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(15px);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.18);
        }
        .hero-card p {
          color: #fff;
          font-size: 1.2rem;
          line-height: 1.35;
          letter-spacing: -0.02em;
          font-weight: 700;
        }
        .stack-2 {
          margin-left: 24px;
        }
        .stack-3 {
          margin-left: 50px;
        }
        .mobile-actions {
          position: fixed;
          left: 14px;
          right: 14px;
          bottom: max(14px, 4vh);
          z-index: 5;
          display: grid;
          gap: 10px;
          padding: 14px;
          border-radius: 22px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(5, 8, 12, 0.5);
          backdrop-filter: blur(18px);
        }
        @media (min-width: 1024px) {
          .hero-shell {
            padding: 38px 56px;
          }
          .hero-copy {
            margin-bottom: 92px;
          }
          .hero-stack {
            display: block;
          }
          .mobile-actions {
            display: none;
          }
          .chip-bar {
            bottom: 30px;
          }
        }
        @media (max-width: 767px) {
          .desktop-cta {
            display: none;
          }
          .hero-copy {
            margin-bottom: 215px;
          }
          .chip-bar {
            bottom: 166px;
            left: 16px;
            right: 16px;
          }
          .hero-overlay {
            background: radial-gradient(circle at 50% 125%, rgba(0, 0, 0, 0.98), rgba(0, 0, 0, 0.78) 42%, rgba(0, 0, 0, 0.86));
          }
        }
      `}</style>
    </div>
  );
}
