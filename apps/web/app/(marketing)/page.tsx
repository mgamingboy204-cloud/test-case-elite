"use client";

import Link from "next/link";
import { type MouseEvent, useMemo, useState } from "react";
import { Button } from "@/app/components/ui/Button";

const features = [
  {
    icon: "✓",
    title: "Video Verified",
    desc: "Every member is identity-verified through a live video call for your safety.",
  },
  {
    icon: "♥",
    title: "Quality Matches",
    desc: "Our algorithm focuses on compatibility, not volume. Fewer, better connections.",
  },
  {
    icon: "★",
    title: "Premium Experience",
    desc: "No ads, no bots, no games. A clean, premium dating experience you deserve.",
  },
  {
    icon: "⚑",
    title: "Safe & Private",
    desc: "End-to-end privacy controls, instant reporting, and a dedicated safety team.",
  },
];

const stats = [
  { value: "$50K+$", label: "Avg Member Income" },
  { value: "$12K+$", label: "Premium Dates Booked" },
  { value: "$98%$", label: "Satisfaction Rate" },
];

function TiltCard({ title, subtitle, className }: { title: string; subtitle: string; className?: string }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const transform = useMemo(() => `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, [tilt.x, tilt.y]);

  const onMove = (event: MouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 1024) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    setTilt({ x: (0.5 - py) * 14, y: (px - 0.5) * 14 });
  };

  return (
    <div className={`glass-card ${className ?? ""}`} style={{ transform }} onMouseMove={onMove} onMouseLeave={() => setTilt({ x: 0, y: 0 })}>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
}

export default function HomePage() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="marketing-home">
      <section className="hero-shell">
        <div className="hero-overlay" />

        <div className="hero-copy">
          <p className="hero-kicker">Elite Match</p>
          <h1>Start something epic.</h1>
          <p className="hero-subtitle">
            Full-bleed, premium matchmaking for ambitious singles ready for real connection.
          </p>

          <div className="desktop-cta">
            <Link href="/signup">
              <Button size="lg" style={{ borderRadius: 999, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 20px 40px rgba(230,57,70,0.35)" }}>Create Account</Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="secondary" style={{ borderRadius: 999 }}>Log In</Button>
            </Link>
          </div>
        </div>

        <div className="stats-bar">
          {stats.map((s) => (
            <div key={s.label} className="stat-item">
              <span>{s.value}</span>
              <small>{s.label}</small>
            </div>
          ))}
        </div>

        <div className="visual-stack">
          <TiltCard title="Verified People" subtitle="Every profile is video screened." className="card-a" />
          <TiltCard title="3D-Lite Motion" subtitle="Cards respond to your movement." className="card-b" />
          <TiltCard title="Privacy First" subtitle="Built-in trust and safety controls." className="card-c" />
        </div>

        <button className="mobile-launch" onClick={() => setSheetOpen(true)}>
          Get Started
        </button>
      </section>

      <section className="features-shell">
        <h2>Why Elite Match</h2>
        <div className="features-grid">
          {features.map((f) => (
            <article key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {sheetOpen && (
        <div className="mobile-sheet-wrap" onClick={() => setSheetOpen(false)}>
          <div className="mobile-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="sheet-handle" />
            <h3>Welcome to Elite Match</h3>
            <p>Choose how you want to begin.</p>
            <div className="sheet-actions">
              <Link href="/signup" onClick={() => setSheetOpen(false)}>
                <Button size="lg" fullWidth style={{ borderRadius: 999 }}>Create Account</Button>
              </Link>
              <Link href="/login" onClick={() => setSheetOpen(false)}>
                <Button size="lg" variant="secondary" fullWidth style={{ borderRadius: 999 }}>Sign In</Button>
              </Link>
            </div>
            <button className="sheet-close" onClick={() => setSheetOpen(false)}>Close</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .marketing-home { min-height: 100vh; background: var(--bg); color: var(--text); font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
        .hero-shell { position: relative; min-height: 100vh; padding: 24px; background-image: url('https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=2000&q=80'); background-size: cover; background-position: center; overflow: hidden; display: flex; flex-direction: column; justify-content: flex-end; }
        .hero-overlay { position: absolute; inset: 0; background: radial-gradient(circle at 50% 120%, rgba(0,0,0,0.92), rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.58)); }
        .hero-copy { position: relative; z-index: 2; margin-bottom: 110px; max-width: 620px; }
        .hero-kicker { font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase; color: rgba(255,255,255,0.78); margin-bottom: 12px; }
        .hero-copy h1 { font-size: clamp(2.1rem, 8vw, 5.2rem); color: #fff; line-height: 0.96; letter-spacing: -0.04em; font-weight: 800; }
        .hero-subtitle { margin-top: 18px; font-size: clamp(0.95rem, 2.1vw, 1.2rem); color: rgba(255,255,255,0.86); max-width: 560px; line-height: 1.55; }
        .desktop-cta { display: flex; gap: 12px; margin-top: 28px; }
        .stats-bar { position: absolute; left: 24px; right: 24px; bottom: 24px; z-index: 2; background: linear-gradient(135deg, rgba(255,255,255,0.17), rgba(255,255,255,0.04)); border: 1px solid rgba(255,255,255,0.26); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border-radius: 999px; padding: 16px 22px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; box-shadow: 0 8px 26px rgba(0,0,0,0.2); }
        .stat-item { text-align: center; color: #fff; display: flex; flex-direction: column; gap: 4px; }
        .stat-item span { font-size: clamp(1.2rem, 3.5vw, 2rem); font-weight: 800; }
        .stat-item small { font-size: 11px; letter-spacing: 0.03em; color: rgba(255,255,255,0.82); }
        .visual-stack { position: absolute; right: 3%; top: 18%; width: min(450px, 42vw); z-index: 2; display: none; }
        .glass-card { border-radius: 24px; padding: 24px; margin-bottom: 14px; border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(15px); background: rgba(255,255,255,0.05); box-shadow: 0 12px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.18); }
        .glass-card h3 { color: #fff; margin-bottom: 6px; }
        .glass-card p { color: rgba(255,255,255,0.78); }
        .card-b { margin-left: 26px; }
        .card-c { margin-left: 54px; }
        .mobile-launch { position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 4; border-radius: 999px; padding: 16px; font-weight: 700; color: #fff; background: linear-gradient(120deg, #ff4d5a, #d12836); box-shadow: inset 0 1px 0 rgba(255,255,255,0.45), 0 18px 32px rgba(209,40,54,0.45); }
        .features-shell { padding: 64px 20px 92px; background: linear-gradient(180deg, rgba(9,9,12,0.96), rgba(19,19,28,0.96)); }
        :global([data-theme='light']) .features-shell { background: linear-gradient(180deg, rgba(241,245,255,0.9), rgba(228,236,250,0.95)); }
        .features-shell h2 { text-align: center; margin-bottom: 24px; color: #fff; font-size: clamp(1.6rem, 4vw, 2.2rem); font-weight: 800; }
        :global([data-theme='light']) .features-shell h2 { color: #202331; }
        .features-grid { max-width: 1100px; margin: 0 auto; display: grid; gap: 16px; grid-template-columns: repeat(1, minmax(0,1fr)); }
        .feature-card { border-radius: 16px; padding: 20px; backdrop-filter: blur(15px); background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 6px 18px rgba(0,0,0,0.18); }
        .feature-icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; background: rgba(255,255,255,0.12); margin-bottom: 12px; }
        .feature-card h4 { color: #fff; margin-bottom: 8px; font-weight: 700; }
        .feature-card p { color: rgba(255,255,255,0.78); font-size: 0.95rem; }
        :global([data-theme='light']) .feature-card { background: rgba(255,255,255,0.58); border-color: rgba(255,255,255,0.7); }
        :global([data-theme='light']) .feature-card h4, :global([data-theme='light']) .feature-card p { color: #1f2533; }
        .mobile-sheet-wrap { position: fixed; inset: 0; background: rgba(3,5,8,0.55); backdrop-filter: blur(14px); z-index: 50; display: flex; align-items: flex-end; }
        .mobile-sheet { width: 100%; border-radius: 24px 24px 0 0; padding: 18px 20px calc(28px + env(safe-area-inset-bottom)); background: rgba(255,255,255,0.08); border-top: 1px solid rgba(255,255,255,0.2); backdrop-filter: blur(20px); }
        .sheet-handle { width: 44px; height: 5px; border-radius: 999px; background: rgba(255,255,255,0.45); margin: 0 auto 16px; }
        .mobile-sheet h3 { color: #fff; margin-bottom: 6px; text-align: center; }
        .mobile-sheet p { text-align: center; color: rgba(255,255,255,0.74); margin-bottom: 18px; }
        .sheet-actions { display: grid; gap: 10px; }
        .sheet-actions :global(a) { width: 100%; }
        .sheet-actions :global(a:last-child button) { background: linear-gradient(120deg, #ff4d5a, #d12836); color: #fff; border: 1px solid rgba(255,255,255,0.2); min-height: 48px; }
        .sheet-actions :global(button) { min-height: 48px; }
        .sheet-close { display: block; margin: 14px auto 0; color: rgba(255,255,255,0.75); }
        @media (min-width: 1024px) {
          .hero-shell { padding: 38px 56px; }
          .visual-stack { display: block; }
          .mobile-launch { display: none; }
          .features-grid { grid-template-columns: repeat(4, minmax(0,1fr)); }
        }
        @media (max-width: 767px) {
          .desktop-cta { display: none; }
          .hero-shell { min-height: 94vh; justify-content: flex-start; padding-top: 80px; }
          .hero-copy { margin-bottom: 24px; }
          .hero-kicker, .hero-copy h1, .hero-subtitle { margin-bottom: 24px; }
          .stats-bar { position: relative; left: auto; right: auto; bottom: auto; margin-bottom: 24px; border-radius: 20px; grid-template-columns: 1fr; gap: 14px; padding: 20px; }
          .visual-stack { margin-bottom: 24px; }
          .features-shell { padding-top: 40px; }
          .features-shell h2 { margin-bottom: 24px; }
          .features-grid { gap: 24px; }
          .mobile-launch { width: calc(100% - 32px); }
        }
      `}</style>
    </div>
  );
}
