"use client";

import Link from "next/link";
import { PremiumBadge } from "@/app/components/premium/PremiumBadge";
import { PremiumButton } from "@/app/components/premium/PremiumButton";
import { PremiumCard } from "@/app/components/premium/PremiumCard";
import { SectionHeading } from "@/app/components/premium/SectionHeading";
import { HomeBackground } from "@/app/components/marketing/HomeBackground";

const features = [
  {
    icon: "✔",
    title: "Video Verified",
    desc: "Every member is identity-verified through a live video call for your safety."
  },
  {
    icon: "♥",
    title: "Quality Matches",
    desc: "Our algorithm focuses on compatibility, not volume. Fewer, better connections."
  },
  {
    icon: "★",
    title: "Premium Experience",
    desc: "No ads, no bots, no games. A clean, premium dating experience you deserve."
  },
  {
    icon: "⚑",
    title: "Safe & Private",
    desc: "End-to-end privacy controls, instant reporting, and a dedicated safety team."
  }
];

const stats = [
  { value: "50K+", label: "Verified Members" },
  { value: "12K+", label: "Successful Matches" },
  { value: "98%", label: "Satisfaction Rate" }
];

export default function HomePage() {
  return (
    <div className="premium-landing">
      <HomeBackground />
      <section className="hero-section">
        <div className="fade-in">
          <PremiumBadge>Private Club for Serious Relationships</PremiumBadge>
        </div>
        <h1 className="hero-title fade-in">
          Where meaningful
          <br />
          connections begin
        </h1>
        <p className="hero-subtitle fade-in">
          Elite Match is the premium dating platform for verified singles who are serious about finding real, lasting
          relationships.
        </p>
        <div className="hero-actions fade-in">
          <Link href="/signup">
            <PremiumButton>Get Started</PremiumButton>
          </Link>
          <Link href="/learn">
            <PremiumButton variant="secondary">How It Works</PremiumButton>
          </Link>
        </div>
      </section>

      <section className="hero-stats">
        {stats.map((s) => (
          <div key={s.label} className="hero-stats__item">
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      <section className="feature-section">
        <SectionHeading
          eyebrow="Member Benefits"
          title="Why Elite Match?"
          description="Designed for people who value quality conversations, verified profiles, and privacy-first dating."
        />
        <div className="feature-grid">
          {features.map((feature) => (
            <PremiumCard key={feature.title} className="feature-card">
              <div className="feature-card__icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </PremiumCard>
          ))}
        </div>
      </section>

      <section className="cta-section">
        <PremiumCard className="cta-card">
          <SectionHeading
            title="Ready to find your match?"
            description="Join thousands of verified singles on Elite Match today."
          />
          <Link href="/signup">
            <PremiumButton>Join Now</PremiumButton>
          </Link>
        </PremiumCard>
      </section>
    </div>
  );
}
