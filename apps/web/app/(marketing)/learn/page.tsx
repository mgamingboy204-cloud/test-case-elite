"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/Button";

const steps = [
  {
    num: "01",
    title: "Create your profile",
    desc: "Sign up, add your photos, and share what matters most to you.",
  },
  {
    num: "02",
    title: "Complete verification",
    desc: "Quick video verification keeps the community real and trustworthy.",
  },
  {
    num: "03",
    title: "Connect intentionally",
    desc: "Discover compatible people and move forward at your own pace.",
  },
];

export default function LearnPage() {
  return (
    <div className="page-bg">
      <div className="premium-wrap">
        <h1>How Elite Match Works</h1>
        <p className="intro-copy">A focused 3-step experience designed for quality connections.</p>

        <div className="steps-grid">
          {steps.map((step, index) => (
            <article key={step.num} className="step-card" style={{ animationDelay: `${index * 120}ms` }}>
              <p className="step-num">{step.num}</p>
              <h3>{step.title}</h3>
              <p className="step-desc">{step.desc}</p>
            </article>
          ))}
        </div>

        <div className="cta">
          <Link href="/signup">
            <Button size="lg" style={{ borderRadius: 999 }}>Get Started</Button>
          </Link>
        </div>
      </div>

      <style jsx>{`
        .page-bg { padding: 2rem 1rem 5rem; }
        .premium-wrap {
          max-width: 920px;
          margin: 0 auto;
          border-radius: 28px;
          padding: 2rem;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(15, 15, 15, 0.7);
          backdrop-filter: blur(25px);
          box-shadow: 0 22px 48px rgba(0,0,0,0.32);
        }
        h1 { margin-bottom: 10px; color: #fff; }
        .intro-copy { color: rgba(255,255,255,0.82); font-size: 1rem; margin-bottom: 1.8rem; }
        .steps-grid { display: grid; gap: 1rem; }
        .step-card {
          border-radius: 20px;
          padding: 1.2rem;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          box-shadow: 0 12px 28px rgba(0,0,0,0.28);
          transform: translateY(12px);
          opacity: 0;
          animation: rise 500ms ease forwards;
        }
        .step-num { color: var(--primary); font-weight: 800; letter-spacing: 0.08em; margin-bottom: 6px; }
        h3 { color: #fff; margin-bottom: 6px; }
        .step-desc { color: rgba(255,255,255,0.82); line-height: 1.6; }
        .cta { margin-top: 1.8rem; text-align: center; }
        @keyframes rise { to { transform: translateY(0); opacity: 1; } }
        @media (max-width: 768px) {
          .premium-wrap { padding: 1.3rem; border-radius: 22px; }
          .page-bg { padding-top: 1rem; }
        }
      `}</style>
    </div>
  );
}
