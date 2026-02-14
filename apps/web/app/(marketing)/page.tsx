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
            setTilt({ x: -(nx * 12), y: ny * 12 });
          }}
          onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        >
          <div className="profile-card card-a" style={{ transform: `translate3d(${tilt.y * 1.2}px, ${tilt.x * -1.2}px, 30px)` }}>
            <span className="profile-badge">\u2714 Verified Profiles</span>
            <h3>Video Verified</h3>
            <p>Safe & Private</p>
          </div>
          <div className="profile-card card-b" style={{ transform: `translate3d(${tilt.y * -0.9}px, ${tilt.x * 0.9}px, 14px)` }}>
            <h3>Quality Matches</h3>
            <p>Premium Experience</p>
          </div>
          <div className="profile-card card-c" style={{ transform: `translate3d(${tilt.y * 0.6}px, ${tilt.x * -0.6}px, 20px)` }}>
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
        <p>
          Join thousands of verified singles on Elite Match today.
        </p>
        <Link href="/signup">
          <Button size="lg">Join Now</Button>
        </Link>
      </section>

      <style jsx>{`
        .marketing-home { background: radial-gradient(1200px 500px at 15% -10%, rgba(230, 57, 70, 0.24), transparent 70%), radial-gradient(900px 380px at 90% 0%, rgba(186, 28, 40, 0.18), transparent 70%), linear-gradient(180deg, #09090d 0%, #111119 45%, #151520 100%); }
        .hero-shell { max-width: 1150px; margin: 0 auto; padding: 92px 24px 70px; display: grid; grid-template-columns: 1.1fr 1fr; gap: 48px; align-items: center; }
        .hero-content h1 { font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 800; line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 20px; }
        .hero-content p { font-size: 18px; color: var(--muted); max-width: 480px; margin: 0 0 32px; line-height: 1.6; }
        .hero-cta { display: flex; gap: 12px; flex-wrap: wrap; }
        .hero-visual { position: relative; min-height: 330px; perspective: 1200px; transform-style: preserve-3d; transition: transform 250ms ease; }
        .profile-card { position: absolute; width: min(340px, 88%); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.14); padding: 22px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); background: linear-gradient(145deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.04)); box-shadow: 0 25px 60px rgba(0, 0, 0, 0.36), 0 0 40px rgba(230, 57, 70, 0.15); transition: transform 220ms ease; }
        .profile-card h3 { margin-bottom: 6px; }
        .profile-card p { color: var(--muted); font-size: 14px; }
        .profile-badge { display: inline-flex; padding: 6px 12px; border-radius: var(--radius-full); background: rgba(230, 57, 70, 0.16); border: 1px solid rgba(255, 99, 99, 0.38); margin-bottom: 16px; font-size: 12px; font-weight: 700; }
        .card-a { top: 0; left: 0; }
        .card-b { top: 84px; right: 8px; }
        .card-c { bottom: 0; left: 42px; }
        .stats-shell { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; max-width: 960px; margin: 0 auto; padding: 24px; }
        .stat-item { text-align: center; border: 1px solid rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.06); border-radius: 18px; backdrop-filter: blur(10px); padding: 20px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.1), 0 20px 40px rgba(0,0,0,0.24); }
        .stat-value { font-size: 36px; font-weight: 800; color: var(--primary); letter-spacing: -0.02em; }
        .stat-label { font-size: 14px; color: var(--muted); margin-top: 4px; }
        .features-shell { max-width: 1080px; margin: 0 auto; padding: 74px 24px; }
        .features-shell h2 { text-align: center; margin-bottom: 48px; font-size: clamp(1.5rem, 3vw, 2rem); }
        .features-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; }
        .feature-card { background: linear-gradient(160deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.05)); border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 18px 34px rgba(0,0,0,0.24); backdrop-filter: blur(10px); transition: transform 200ms ease; }
        .feature-card:hover { transform: translateY(-6px); }
        .feature-icon { width: 48px; height: 48px; border-radius: var(--radius-md); background: var(--primary-light); display: flex; align-items: center; justify-content: center; font-size: 22px; color: var(--primary); margin-bottom: 16px; }
        .cta-shell { text-align: center; padding: 72px 24px; margin-top: 8px; background: linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03)); border-top: 1px solid rgba(255, 255, 255, 0.1); }
        .cta-shell p { color: var(--muted); font-size: 16px; max-width: 400px; margin: 0 auto 28px; }
        @media (max-width: 1024px) { .hero-shell { grid-template-columns: 1fr; gap: 24px; padding-top: 76px; } .hero-content { text-align: center; } .hero-content p { margin-left: auto; margin-right: auto; } .hero-cta { justify-content: center; } .features-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 768px) { .hero-shell { padding: 60px 16px 34px; } .hero-visual { min-height: auto; display: flex; flex-direction: column; gap: 14px; transform: none !important; } .profile-card { position: relative; width: 100%; left: auto; right: auto; top: auto; bottom: auto; transform: none !important; border-radius: 18px; } .stats-shell { grid-template-columns: 1fr; padding: 16px; } .features-shell { padding: 56px 16px; } .features-grid { grid-template-columns: 1fr; gap: 14px; } .feature-card:hover { transform: none; } .cta-shell { padding: 58px 16px 68px; border-radius: 24px 24px 0 0; } }
      `}</style>
    </div>
  );
}
