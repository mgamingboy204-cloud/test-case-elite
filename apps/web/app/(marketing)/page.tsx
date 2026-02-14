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
            <Link href="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/learn">
              <Button size="lg" variant="secondary">
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
            setTilt({ x: -(nx * 10), y: ny * 10 });
          }}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        >
          <div className="profile-card card-a" style={{ transform: `translate3d(${tilt.y * 1.15}px, ${tilt.x * -1.15}px, 30px)` }}>
            <span className="profile-badge">\u2714 Verified Profiles</span>
            <h3>Video Verified</h3>
            <p>Safe & Private</p>
          </div>
          <div className="profile-card card-b" style={{ transform: `translate3d(${tilt.y * -0.8}px, ${tilt.x * 0.8}px, 16px)` }}>
            <h3>Quality Matches</h3>
            <p>Premium Experience</p>
          </div>
          <div className="profile-card card-c" style={{ transform: `translate3d(${tilt.y * 0.5}px, ${tilt.x * -0.5}px, 22px)` }}>
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
          position: relative;
          overflow: hidden;
          isolation: isolate;
          background:
            radial-gradient(1200px 540px at 15% -12%, rgba(235, 57, 70, 0.26), transparent 68%),
            radial-gradient(920px 380px at 90% 0%, rgba(168, 24, 36, 0.24), transparent 70%),
            linear-gradient(180deg, #09090d 0%, #111119 46%, #151520 100%);
        }
        .marketing-home::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='1200' height='820' viewBox='0 0 1200 820' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3CradialGradient id='g1' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='translate(280 160) rotate(31) scale(420 250)'%3E%3Cstop stop-color='%23ffffff' stop-opacity='0.28'/%3E%3Cstop offset='1' stop-color='%23ffffff' stop-opacity='0'/%3E%3C/radialGradient%3E%3CradialGradient id='g2' cx='0' cy='0' r='1' gradientUnits='userSpaceOnUse' gradientTransform='translate(930 250) rotate(-22) scale(470 290)'%3E%3Cstop stop-color='%23e63946' stop-opacity='0.30'/%3E%3Cstop offset='1' stop-color='%23e63946' stop-opacity='0'/%3E%3C/radialGradient%3E%3C/defs%3E%3Crect width='1200' height='820' fill='url(%23g1)'/%3E%3Crect width='1200' height='820' fill='url(%23g2)'/%3E%3C/svg%3E");
          background-size: cover;
          opacity: 0.6;
          z-index: -1;
          pointer-events: none;
        }
        .hero-shell { max-width: 1150px; margin: 0 auto; padding: 92px 24px 70px; display: grid; grid-template-columns: 1.05fr 1fr; gap: 48px; align-items: center; }
        .hero-content h1 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 20px; text-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .hero-content p { font-size: 18px; color: var(--muted); max-width: 480px; margin: 0 0 32px; line-height: 1.6; }
        .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; }

        .hero-visual { position: relative; min-height: 350px; perspective: 1200px; transform-style: preserve-3d; transition: transform 240ms ease; }
        .profile-card { position: absolute; width: min(350px, 90%); border-radius: 22px; border: 1px solid rgba(255, 255, 255, 0.2); padding: 22px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); background: linear-gradient(150deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.06)); box-shadow: 0 28px 70px rgba(0,0,0,0.34), 0 0 38px rgba(230, 57, 70, 0.16); transition: transform 220ms ease, box-shadow 220ms ease; }
        .profile-card h3 { margin-bottom: 6px; }
        .profile-card p { color: var(--muted); font-size: 14px; }
        .profile-badge { display: inline-flex; padding: 6px 12px; border-radius: var(--radius-full); background: rgba(230,57,70,0.18); border: 1px solid rgba(255,99,99,0.42); margin-bottom: 16px; font-size: 12px; font-weight: 700; }
        .card-a { top: 0; left: 0; }
        .card-b { top: 98px; right: 8px; }
        .card-c { bottom: 0; left: 48px; }

        .stats-shell { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; max-width: 960px; margin: 0 auto; padding: 24px; }
        .stat-item { text-align: center; border: 1px solid rgba(255,255,255,0.14); background: rgba(255,255,255,0.08); border-radius: 20px; backdrop-filter: blur(10px); padding: 20px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), 0 20px 40px rgba(0,0,0,0.22); }
        .stat-value { font-size: 36px; font-weight: 800; color: var(--primary); letter-spacing: -0.02em; }
        .stat-label { font-size: 14px; color: var(--muted); margin-top: 4px; }

        .features-shell { max-width: 1080px; margin: 0 auto; padding: 74px 24px; }
        .features-shell h2 { text-align: center; margin-bottom: 48px; font-size: clamp(1.5rem, 3vw, 2rem); }
        .features-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; }
        .feature-card { background: linear-gradient(160deg, rgba(255,255,255,0.2), rgba(255,255,255,0.07)); border: 1px solid rgba(255,255,255,0.14); box-shadow: 0 18px 34px rgba(0,0,0,0.22); backdrop-filter: blur(10px); transition: transform 220ms ease, box-shadow 220ms ease; }
        .feature-card:hover { transform: translateY(-7px) scale(1.01); box-shadow: 0 24px 44px rgba(0,0,0,0.28); }
        .feature-icon { width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 22px; color: var(--primary); margin-bottom: 16px; }

        .cta-shell { text-align: center; padding: 78px 24px; margin-top: 8px; background: linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.03)); border-top: 1px solid rgba(255,255,255,0.14); }
        .cta-shell p { color: var(--muted); font-size: 16px; max-width: 420px; margin: 0 auto 28px; }

        :global([data-theme="light"]) .marketing-home {
          background:
            radial-gradient(1200px 560px at 8% -14%, rgba(244, 114, 121, 0.28), transparent 65%),
            radial-gradient(940px 420px at 95% 0%, rgba(251, 146, 158, 0.28), transparent 68%),
            linear-gradient(180deg, #fff7f8 0%, #fffafa 50%, #fff 100%);
        }
        :global([data-theme="light"]) .marketing-home::before { opacity: 0.75; filter: saturate(1.4) hue-rotate(-8deg); }
        :global([data-theme="light"]) .hero-content h1 { color: #26141a; text-shadow: 0 10px 24px rgba(228,72,84,0.12); }
        :global([data-theme="light"]) .hero-content p,
        :global([data-theme="light"]) .stat-label,
        :global([data-theme="light"]) .profile-card p,
        :global([data-theme="light"]) .cta-shell p { color: #6f5560; }
        :global([data-theme="light"]) .profile-card,
        :global([data-theme="light"]) .stat-item,
        :global([data-theme="light"]) .feature-card { border-color: rgba(230,57,70,0.2); background: linear-gradient(160deg, rgba(255,255,255,0.88), rgba(255,238,240,0.7)); box-shadow: 0 16px 36px rgba(180,45,61,0.14); }
        :global([data-theme="light"]) .cta-shell { background: linear-gradient(180deg, rgba(255,235,238,0.8), rgba(255,255,255,0.72)); border-top-color: rgba(230,57,70,0.2); }

        @media (max-width: 1024px) {
          .hero-shell { grid-template-columns: 1fr; gap: 28px; padding-top: 78px; }
          .hero-content { text-align: center; }
          .hero-content p { margin-left: auto; margin-right: auto; }
          .hero-cta { justify-content: center; }
          .features-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 768px) {
          .hero-shell { padding: 56px 16px 30px; }
          .hero-content h1 { font-size: clamp(1.92rem, 8.8vw, 2.45rem); }
          .hero-content p { font-size: 16px; margin-bottom: 24px; }
          .hero-cta { gap: 10px; }

          .hero-visual { min-height: auto; display: flex; flex-direction: column; gap: 14px; transform: none !important; }
          .profile-card { position: relative; width: 100%; left: auto; right: auto; top: auto; bottom: auto; transform: none !important; border-radius: 18px; padding: 18px; }

          .stats-shell { grid-template-columns: 1fr; padding: 14px 16px 8px; gap: 12px; }
          .stat-item { text-align: left; display: flex; align-items: baseline; justify-content: space-between; padding: 18px; }

          .features-shell { padding: 44px 16px; }
          .features-shell h2 { margin-bottom: 20px; text-align: left; }
          .features-grid { grid-template-columns: 1fr; gap: 12px; }
          .feature-card { border-radius: 18px; }
          .feature-card:hover { transform: none; }

          .cta-shell { margin: 12px 14px 0; padding: 34px 16px 44px; border-radius: 24px 24px 0 0; }
        }
      `}</style>
    </div>
  );
}
