"use client";

import Link from "next/link";
import { PremiumBadge } from "@/app/components/premium/PremiumBadge";
import { PremiumButton } from "@/app/components/premium/PremiumButton";
import { PremiumCard } from "@/app/components/premium/PremiumCard";
import { HomeBackground } from "@/app/components/marketing/HomeBackground";

const pillars = [
  { icon: "✓", title: "Verified Members", desc: "Every profile is reviewed before access is granted." },
  { icon: "◌", title: "Private by Design", desc: "Confidential tools protect your identity and conversations." },
  { icon: "◆", title: "Real Meetings", desc: "Introductions are curated for meaningful in-person outcomes." },
];

const steps = ["Verification", "Membership", "Introductions"];

export default function HomePage() {
  return (
    <div className="premium-landing">
      <HomeBackground />
      <section className="hero-section">
        <PremiumBadge>Invite-only • Secure • Confidential</PremiumBadge>
        <h1 className="hero-title">Private Club for verified membership.</h1>
        <p className="hero-subtitle">Calm, secure introductions for people who value privacy and intention.</p>
        <div className="hero-actions">
          <Link href="/signup"><PremiumButton>Request Access</PremiumButton></Link>
          <Link href="/learn"><PremiumButton variant="secondary">How it works</PremiumButton></Link>
        </div>
      </section>

      <section className="feature-section">
        <div className="feature-grid" style={{ gridTemplateColumns: "repeat(3,minmax(0,1fr))" }}>
          {pillars.map((pillar) => (
            <PremiumCard key={pillar.title} className="feature-card">
              <div className="feature-card__icon">{pillar.icon}</div>
              <h3>{pillar.title}</h3>
              <p>{pillar.desc}</p>
            </PremiumCard>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <PremiumCard className="cta-card">
          <h2 className="ds-title">How it works</h2>
          <div className="stepper" style={{ width: "min(560px, 100%)" }}>
            {steps.map((step, index) => (
              <div key={step} style={{ display: "contents" }}>
                <div key={step} className="stepper__dot is-active">{index + 1}</div>
                {index < steps.length - 1 ? <div className="stepper__line" /> : null}
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gap: 12, width: "100%", maxWidth: 560 }}>
            {steps.map((step) => <p key={step} className="ds-subtitle">{step}</p>)}
          </div>
        </PremiumCard>
      </section>
    </div>
  );
}
