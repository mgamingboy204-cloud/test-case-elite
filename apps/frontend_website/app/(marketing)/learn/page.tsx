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
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 style={{ marginBottom: 12 }}>How Elite Match Works</h1>
      <p style={{ color: "var(--muted)", fontSize: 17, lineHeight: 1.6, marginBottom: 48 }}>
        A simple, secure process designed to help you find genuine connections.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {steps.map((step) => (
          <div
            key={step.num}
            style={{
              display: "flex",
              gap: 24,
              alignItems: "flex-start",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "var(--radius-md)",
                background: "var(--primary-light)",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {step.num}
            </div>
            <div>
              <h3 style={{ marginBottom: 6 }}>{step.title}</h3>
              <p style={{ color: "var(--muted)", fontSize: 15, lineHeight: 1.6 }}>
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 56 }}>
        <Link href="/signup">
          <Button size="lg">Get Started Now</Button>
        </Link>
      </div>
    </div>
  );
}
