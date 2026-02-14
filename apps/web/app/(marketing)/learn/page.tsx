"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

const steps = [
  {
    num: "01",
    title: "Create Your Profile",
    desc: "Sign up with your phone number and complete your profile with photos, interests, and preferences.",
  },
  {
    num: "02",
    title: "Get Verified",
    desc: "Complete a quick video verification call to prove you are who you say you are. It takes under 5 minutes.",
  },
  {
    num: "03",
    title: "Discover & Connect",
    desc: "Browse curated profiles, swipe on people you like, and get matched with compatible singles.",
  },
  {
    num: "04",
    title: "Meet In Real Life",
    desc: "Exchange numbers through our secure consent system and take your connection offline.",
  },
];

export default function LearnPage() {
  return (
    <div className="learn-shell">
      <h1>How Elite Match Works</h1>
      <p className="intro-copy">
        A simple, secure process designed to help you find genuine connections.
      </p>

      <div className="timeline">
        {steps.map((step, index) => (
          <div key={step.num} className="timeline-row" style={{ animationDelay: `${index * 90}ms` }}>
            <div className="step-pin-wrap">
              <div className="step-line" aria-hidden="true" />
              <div className="step-pin">{step.num}</div>
            </div>
            <article className={`step-card ${index === 1 ? "active" : ""}`}>
              <h3 style={{ marginBottom: 6 }}>{step.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6 }}>{step.desc}</p>
            </article>
          </div>
        ))}
      </div>

      <div className="cta">
        <Link href="/signup">
          <Button size="lg">Get Started Now</Button>
        </Link>
      </div>

      <style jsx>{`
        .learn-shell { max-width: 980px; margin: 0 auto; padding: 56px 24px 90px; }
        h1 { margin-bottom: 12px; }
        .intro-copy { color: var(--muted); font-size: 17px; line-height: 1.6; margin-bottom: 44px; max-width: 620px; }
        .timeline { display: flex; flex-direction: column; gap: 18px; }
        .timeline-row { display: grid; grid-template-columns: 80px 1fr; align-items: stretch; gap: 16px; opacity: 0; transform: translateY(16px); animation: slideIn 450ms ease forwards; }
        .step-pin-wrap { position: relative; display: flex; justify-content: center; }
        .step-line { position: absolute; left: calc(50% - 1px); top: 58px; bottom: -18px; width: 2px; background: linear-gradient(180deg, rgba(230,57,70,0.6), rgba(230,57,70,0)); }
        .timeline-row:last-child .step-line { display: none; }
        .step-pin { width: 52px; height: 52px; border-radius: 14px; background: rgba(255,255,255,0.08); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; border: 1px solid rgba(255,255,255,0.18); box-shadow: 0 12px 24px rgba(0,0,0,0.25); }
        .step-card { border-radius: 18px; border: 1px solid rgba(255,255,255,0.12); background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04)); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); box-shadow: 0 16px 30px rgba(0,0,0,0.24); padding: 22px; transition: transform 220ms ease, box-shadow 220ms ease; }
        .step-card:hover { transform: translateY(-4px); }
        .step-card.active { border-color: rgba(255,99,99,0.5); box-shadow: 0 18px 36px rgba(0,0,0,0.28), 0 0 24px rgba(230,57,70,0.25); transform: scale(1.015); }
        .cta { text-align: center; margin-top: 56px; }
        @keyframes slideIn { to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 768px) { .learn-shell { padding: 42px 16px 84px; } .timeline-row { grid-template-columns: 1fr; gap: 10px; } .step-pin-wrap { justify-content: flex-start; } .step-line { display: none; } .step-card { border-radius: 20px; padding: 20px; } .step-card:hover { transform: none; } .cta { margin-top: 42px; padding: 18px 14px; border-radius: 20px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); } }
      `}</style>
    </div>
  );
}
