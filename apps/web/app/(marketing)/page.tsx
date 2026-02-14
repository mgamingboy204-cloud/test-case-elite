"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/app/components/ui/Button";
import { Card } from "@/app/components/ui/Card";

const features = [
  {
    icon: "\u2714",
    title: "Video Verified",
    desc: "Every member is identity-verified through a live video call for your safety.",
  },
  {
    icon: "\u2665",
    title: "Quality Matches",
    desc: "Our algorithm focuses on compatibility, not volume. Fewer, better connections.",
  },
  {
    icon: "\u2605",
    title: "Premium Experience",
    desc: "No ads, no bots, no games. A clean, premium dating experience you deserve.",
  },
  {
    icon: "\u2691",
    title: "Safe & Private",
    desc: "End-to-end privacy controls, instant reporting, and a dedicated safety team.",
  },
];

const stats = [
  { value: "50K+", label: "Verified Members" },
  { value: "12K+", label: "Successful Matches" },
  { value: "98%", label: "Satisfaction Rate" },
];

export default function HomePage() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  return (
    <div className="marketing-home">
      <section className="hero-shell">
        <img
          className="hero-bg"
          src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=1600&q=80"
          alt=""
          aria-hidden="true"
        />
        <div className="hero-overlay-top" />
        <div className="hero-overlay-bottom" />

        <div className="hero-head">
          <div className="hero-brand">ELITE MATCH</div>
          <button className="hero-menu" aria-label="Open menu">
            ≡
          </button>
        </div>

        <div className="hero-content">
          <h1 className="fade-in">
            Where meaningful
            <br />
            connections begin
          </h1>
          <p className="fade-in">
            Elite Match is the premium dating platform for verified singles who are
            serious about finding real, lasting relationships.
          </p>
          <div className="hero-cta fade-in">
            <Link href="/signup" className="hero-cta-link">
              <Button size="lg" style={{ width: "100%", borderRadius: 9999, boxShadow: "0 16px 40px rgba(0,0,0,0.25)" }}>
                Get Started
              </Button>
            </Link>
            <Link href="/learn" className="hero-cta-link">
              <Button
                size="lg"
                variant="secondary"
                style={{
                  width: "100%",
                  borderRadius: 9999,
                  border: "1px solid rgba(255,255,255,0.45)",
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
              >
                How It Works
              </Button>
            </Link>
          </div>
        </div>

        <div
          className="hero-visual"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
          onMouseMove={(event) => {
            if (window.innerWidth < 1024) return;
            const rect = event.currentTarget.getBoundingClientRect();
            const nx = (event.clientY - rect.top) / rect.height - 0.5;
            const ny = (event.clientX - rect.left) / rect.width - 0.5;
            setTilt({ x: -(nx * 8), y: ny * 8 });
          }}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        >
          <div className="profile-card card-a" style={{ transform: `translate3d(${tilt.y * 1.05}px, ${tilt.x * -1.05}px, 30px)` }}>
            <span className="profile-badge">\u2714 Verified Profiles</span>
            <h3>Video Verified</h3>
            <p>Safe & Private</p>
          </div>
          <div className="profile-card card-b" style={{ transform: `translate3d(${tilt.y * -0.7}px, ${tilt.x * 0.7}px, 16px)` }}>
            <h3>Quality Matches</h3>
            <p>Premium Experience</p>
          </div>
          <div className="profile-card card-c" style={{ transform: `translate3d(${tilt.y * 0.4}px, ${tilt.x * -0.4}px, 22px)` }}>
            <h3>Elite Match</h3>
            <p>Where meaningful connections begin</p>
          </div>
        </div>
      </section>

      <section className="stats-shell">
        {stats.map((s) => (
          <div key={s.label} className="stat-item">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="features-shell">
        <h2>Why Elite Match?</h2>
        <div className="features-grid">
          {features.map((f) => (
            <Card key={f.title} className="feature-card" style={{ padding: 28 }}>
              <div className="feature-icon">{f.icon}</div>
              <h4 style={{ marginBottom: 8 }}>{f.title}</h4>
              <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="cta-shell">
        <h2 style={{ marginBottom: 16 }}>Ready to find your match?</h2>
        <p>Join thousands of verified singles on Elite Match today.</p>
        <Link href="/signup">
          <Button size="lg">Join Now</Button>
        </Link>
      </section>

      <style jsx>{`
        .marketing-home {
          background:
            radial-gradient(1200px 540px at 15% -12%, rgba(235, 57, 70, 0.22), transparent 68%),
            linear-gradient(180deg, #0e0e14 0%, #151523 100%);
        }
        .hero-shell { position: relative; min-height: 100svh; overflow: hidden; }
        .hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; }
        .hero-overlay-top { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.2) 24%, rgba(0,0,0,0) 50%); }
        .hero-overlay-bottom { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(5,5,8,0) 30%, rgba(5,5,8,0.64) 58%, rgba(5,5,8,0.92) 100%); }

        .hero-head {
          position: absolute;
          top: max(18px, env(safe-area-inset-top));
          left: 16px;
          right: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 3;
        }
        .hero-brand { color: #fff; font-size: 13px; letter-spacing: 0.14em; font-weight: 700; }
        .hero-menu {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.42);
          background: rgba(0,0,0,0.28);
          backdrop-filter: blur(8px);
          color: #fff;
          font-size: 21px;
          line-height: 1;
        }

        .hero-content {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: calc(20px + env(safe-area-inset-bottom));
          z-index: 3;
        }
        .hero-content h1 { font-size: clamp(2.05rem, 11vw, 3.15rem); line-height: 1.05; letter-spacing: -0.03em; margin-bottom: 12px; color: #fff; text-shadow: 0 12px 26px rgba(0,0,0,0.45); }
        .hero-content p { color: rgba(255,255,255,0.88); font-size: 15px; line-height: 1.55; margin-bottom: 20px; max-width: 600px; }
        .hero-cta { display: grid; gap: 10px; }
        .hero-cta-link { width: 100%; }

        .hero-visual { display: none; }

        .stats-shell { display: grid; grid-template-columns: 1fr; gap: 12px; max-width: 1020px; margin: 0 auto; padding: 18px 16px 10px; }
        .stat-item { border-radius: 24px; border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.08); backdrop-filter: blur(10px); padding: 18px 20px; display: flex; align-items: baseline; justify-content: space-between; box-shadow: 0 20px 44px rgba(0,0,0,0.2); }
        .stat-value { font-size: 34px; font-weight: 800; color: var(--primary); letter-spacing: -0.02em; }
        .stat-label { font-size: 14px; color: var(--muted); }

        .features-shell { max-width: 1080px; margin: 0 auto; padding: 42px 16px 56px; }
        .features-shell h2 { text-align: left; margin-bottom: 18px; font-size: clamp(1.5rem, 6.2vw, 2rem); }
        .features-grid { display: grid; grid-template-columns: 1fr; gap: 12px; }
        .feature-card {
          border-radius: 30px;
          background: linear-gradient(160deg, rgba(255,255,255,0.14), rgba(255,255,255,0.06));
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: 0 18px 36px rgba(0,0,0,0.2);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .feature-icon { width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 22px; color: var(--primary); margin-bottom: 16px; }

        .cta-shell { text-align: center; padding: 36px 16px calc(42px + env(safe-area-inset-bottom)); margin: 8px 14px 0; border-radius: 28px 28px 0 0; background: linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03)); border: 1px solid rgba(255,255,255,0.14); border-bottom: none; }
        .cta-shell p { color: var(--muted); font-size: 16px; max-width: 400px; margin: 0 auto 28px; }

        :global([data-theme="light"]) .marketing-home {
          background:
            radial-gradient(1200px 560px at 8% -14%, rgba(244,114,121,0.2), transparent 64%),
            linear-gradient(180deg, #fffaf8 0%, #fff 100%);
        }
        :global([data-theme="light"]) .hero-overlay-top { background: linear-gradient(180deg, rgba(255,255,255,0.66) 0%, rgba(255,255,255,0.1) 24%, rgba(255,255,255,0) 52%); }
        :global([data-theme="light"]) .hero-overlay-bottom { background: linear-gradient(180deg, rgba(255,255,255,0) 30%, rgba(255,245,246,0.68) 58%, rgba(255,245,246,0.95) 100%); }
        :global([data-theme="light"]) .hero-brand { color: #2f1d24; }
        :global([data-theme="light"]) .hero-menu { color: #2f1d24; border-color: rgba(62,40,48,0.2); background: rgba(255,255,255,0.55); }
        :global([data-theme="light"]) .hero-content h1 { color: #2a171f; text-shadow: 0 9px 18px rgba(255,255,255,0.45); }
        :global([data-theme="light"]) .hero-content p { color: #5f4a53; }
        :global([data-theme="light"]) .hero-cta :global(button[style*="variant="]) { color: inherit; }
        :global([data-theme="light"]) .hero-cta :global(button) { box-shadow: 0 16px 32px rgba(180,45,61,0.16) !important; }
        :global([data-theme="light"]) .hero-cta :global(a:nth-child(2) button) { color: #2b1720 !important; background: rgba(255,255,255,0.76) !important; border-color: rgba(53,35,42,0.2) !important; }
        :global([data-theme="light"]) .stat-item,
        :global([data-theme="light"]) .feature-card,
        :global([data-theme="light"]) .cta-shell {
          border-color: rgba(230,57,70,0.18);
          background: linear-gradient(160deg, rgba(255,255,255,0.92), rgba(255,243,245,0.82));
          box-shadow: 0 16px 34px rgba(173,49,67,0.12);
        }

        @media (min-width: 1024px) {
          .hero-shell {
            min-height: 680px;
            max-width: 1150px;
            margin: 0 auto;
            padding: 90px 24px 70px;
            border-radius: 0 0 28px 28px;
            display: grid;
            grid-template-columns: 1.05fr 1fr;
            gap: 48px;
            align-items: center;
          }
          .hero-head { left: 28px; right: 28px; }
          .hero-content { position: relative; left: auto; right: auto; bottom: auto; max-width: 560px; }
          .hero-content p { margin-bottom: 30px; font-size: 17px; }
          .hero-cta { display: flex; gap: 12px; }
          .hero-cta-link { width: auto; }
          .hero-cta-link :global(button) { width: auto !important; }
          .hero-menu { display: none; }

          .hero-visual { display: block; position: relative; min-height: 350px; perspective: 1200px; transform-style: preserve-3d; transition: transform 240ms ease; z-index: 3; }
          .profile-card { position: absolute; width: min(350px, 90%); border-radius: 22px; border: 1px solid rgba(255,255,255,0.2); padding: 22px; backdrop-filter: blur(10px); background: linear-gradient(150deg, rgba(255,255,255,0.2), rgba(255,255,255,0.06)); box-shadow: 0 28px 70px rgba(0,0,0,0.34), 0 0 38px rgba(230,57,70,0.16); }
          .profile-card h3 { margin-bottom: 6px; }
          .profile-card p { color: rgba(255,255,255,0.8); font-size: 14px; }
          .profile-badge { display: inline-flex; padding: 6px 12px; border-radius: var(--radius-full); background: rgba(230,57,70,0.2); border: 1px solid rgba(255,99,99,0.42); margin-bottom: 16px; font-size: 12px; font-weight: 700; }
          .card-a { top: 0; left: 0; }
          .card-b { top: 98px; right: 8px; }
          .card-c { bottom: 0; left: 48px; }

          .stats-shell { grid-template-columns: repeat(3, minmax(0, 1fr)); padding: 24px; }
          .stat-item { display: block; text-align: center; }
          .features-shell { padding: 74px 24px; }
          .features-shell h2 { text-align: center; margin-bottom: 48px; }
          .features-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; }
          .cta-shell { margin: 8px 0 0; border-radius: 0; border-left: none; border-right: none; }
        }
      `}</style>
    </div>
  );
}
