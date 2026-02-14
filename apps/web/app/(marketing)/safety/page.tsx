"use client";

import { Card } from "@/app/components/ui/Card";

const safetyFeatures = [
  {
    icon: "\u2714",
    title: "Identity Verification",
    desc: "Every member undergoes a live video verification call to confirm their identity.",
  },
  {
    icon: "\u2691",
    title: "Report & Block",
    desc: "Instantly report or block anyone who makes you uncomfortable. Our team reviews every report.",
  },
  {
    icon: "\u26E8",
    title: "Photo Moderation",
    desc: "All photos are reviewed for appropriateness before being displayed on profiles.",
  },
  {
    icon: "\u2699",
    title: "Privacy Controls",
    desc: "You decide who sees your profile, your photos, and your contact information.",
  },
];

const tips = [
  "Never share financial information with someone you haven't met in person.",
  "Always meet in a public place for your first date.",
  "Tell a friend or family member about your plans.",
  "Trust your instincts - if something feels off, it probably is.",
  "Use the in-app consent system before sharing personal contact info.",
];

export default function SafetyPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 style={{ marginBottom: 12 }}>Your Safety Matters</h1>
      <p style={{ color: "var(--muted)", fontSize: 17, lineHeight: 1.6, marginBottom: 48 }}>
        At Private Club, safety is not a feature - it is our foundation.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 20,
          marginBottom: 48,
        }}
      >
        {safetyFeatures.map((f) => (
          <Card key={f.title} style={{ padding: 24 }}>
            <div
              style={{
                fontSize: 24,
                color: "var(--primary)",
                marginBottom: 12,
              }}
            >
              {f.icon}
            </div>
            <h4 style={{ marginBottom: 6 }}>{f.title}</h4>
            <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>
              {f.desc}
            </p>
          </Card>
        ))}
      </div>

      <h2 style={{ marginBottom: 20 }}>Safety Tips</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tips.map((tip, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              padding: "12px 16px",
              background: "var(--panel)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                color: "var(--success)",
                fontWeight: 700,
                fontSize: 16,
                flexShrink: 0,
              }}
            >
              {"\u2713"}
            </span>
            <p style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.5, margin: 0 }}>
              {tip}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
