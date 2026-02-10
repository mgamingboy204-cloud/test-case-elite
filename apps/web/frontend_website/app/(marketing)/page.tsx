"use client";

import Link from "next/link";
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
  return (
    <div>
      {/* Hero */}
      <section
        style={{
          textAlign: "center",
          padding: "80px 24px 60px",
          maxWidth: 720,
          margin: "0 auto",
        }}
      >
        <h1
          className="fade-in"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 20,
          }}
        >
          Where meaningful
          <br />
          connections begin
        </h1>
        <p
          className="fade-in"
          style={{
            fontSize: 18,
            color: "var(--muted)",
            maxWidth: 480,
            margin: "0 auto 32px",
            lineHeight: 1.6,
          }}
        >
          Elite Match is the premium dating platform for verified singles who are
          serious about finding real, lasting relationships.
        </p>
        <div
          className="fade-in"
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link href="/signup">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="/learn">
            <Button size="lg" variant="secondary">
              How It Works
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 48,
          flexWrap: "wrap",
          padding: "40px 24px",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "var(--panel)",
        }}
      >
        {stats.map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: "var(--primary)",
                letterSpacing: "-0.02em",
              }}
            >
              {s.value}
            </div>
            <div style={{ fontSize: 14, color: "var(--muted)", marginTop: 4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "64px 24px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: 48,
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
          }}
        >
          Why Elite Match?
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 24,
          }}
        >
          {features.map((f) => (
            <Card key={f.title} style={{ padding: 28 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-md)",
                  background: "var(--primary-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  color: "var(--primary)",
                  marginBottom: 16,
                }}
              >
                {f.icon}
              </div>
              <h4 style={{ marginBottom: 8 }}>{f.title}</h4>
              <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          textAlign: "center",
          padding: "64px 24px",
          background: "var(--panel)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <h2 style={{ marginBottom: 16 }}>Ready to find your match?</h2>
        <p
          style={{
            color: "var(--muted)",
            fontSize: 16,
            marginBottom: 28,
            maxWidth: 400,
            margin: "0 auto 28px",
          }}
        >
          Join thousands of verified singles on Elite Match today.
        </p>
        <Link href="/signup">
          <Button size="lg">Join Now</Button>
        </Link>
      </section>
    </div>
  );
}
