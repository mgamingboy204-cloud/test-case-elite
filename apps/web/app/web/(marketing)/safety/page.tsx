"use client";

import { MarketingContentPage } from "@/app/components/MarketingContentPage";

const safetyFeatures = [
  { icon: "✔", title: "Identity Verification", desc: "Every member undergoes a live video verification call to confirm their identity." },
  { icon: "⚑", title: "Report & Block", desc: "Instantly report or block anyone who makes you uncomfortable. Our team reviews every report." },
  { icon: "⛨", title: "Photo Moderation", desc: "All photos are reviewed for appropriateness before being displayed on profiles." },
  { icon: "⚙", title: "Privacy Controls", desc: "You decide who sees your profile, your photos, and your contact information." }
];

const tips = [
  "Never share financial information with someone you haven't met in person.",
  "Always meet in a public place for your first date.",
  "Tell a friend or family member about your plans.",
  "Trust your instincts - if something feels off, it probably is.",
  "Use the in-app consent system before sharing personal contact info."
];

export default function SafetyPage() {
  return (
    <MarketingContentPage title="Your Safety Matters" subtitle="At Elite Match, safety is not a feature - it is our foundation.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 28 }}>
        {safetyFeatures.map((feature) => (
          <article key={feature.title} className="marketing-panel marketing-interactive" style={{ padding: 22 }}>
            <div style={{ fontSize: 24, marginBottom: 10, color: "var(--primary)" }}>{feature.icon}</div>
            <h4 style={{ marginBottom: 8 }}>{feature.title}</h4>
            <p className="marketing-kicker">{feature.desc}</p>
          </article>
        ))}
      </div>

      <h2 style={{ marginBottom: 14 }}>Safety Tips</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tips.map((tip) => (
          <div key={tip} className="marketing-panel" style={{ padding: "14px 16px", display: "flex", gap: 10, alignItems: "start" }}>
            <span style={{ color: "var(--success)", fontWeight: 700 }}>✓</span>
            <p className="marketing-kicker">{tip}</p>
          </div>
        ))}
      </div>
    </MarketingContentPage>
  );
}
