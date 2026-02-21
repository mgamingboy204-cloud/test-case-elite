"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/Button";
import { MarketingContentPage } from "@/app/components/MarketingContentPage";

const steps = [
  { num: "01", title: "Create Your Profile", desc: "Sign up with your phone number and complete your profile with photos, interests, and preferences." },
  { num: "02", title: "Get Verified", desc: "Complete a quick video verification call to prove you are who you say you are. It takes under 5 minutes." },
  { num: "03", title: "Discover & Connect", desc: "Browse curated profiles, swipe on people you like, and get matched with compatible singles." },
  { num: "04", title: "Meet In Real Life", desc: "Exchange numbers through our secure consent system and take your connection offline." }
];

export default function LearnPage() {
  return (
    <MarketingContentPage title="How Elite Match Works" subtitle="A simple, secure process designed to help you find genuine connections.">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {steps.map((step) => (
          <article key={step.num} className="marketing-panel marketing-interactive" style={{ display: "grid", gridTemplateColumns: "70px 1fr", gap: 16, alignItems: "center", padding: 22 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", display: "grid", placeItems: "center", border: "1px solid var(--marketing-glass-border)", background: "rgba(148,163,184,0.12)", fontWeight: 700 }}>
              {step.num}
            </div>
            <div>
              <h3 style={{ marginBottom: 8 }}>{step.title}</h3>
              <p className="marketing-kicker">{step.desc}</p>
            </div>
          </article>
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        <Link href="/signup">
          <Button size="lg" className="marketing-rose-btn">Get Started Now</Button>
        </Link>
      </div>
    </MarketingContentPage>
  );
}
