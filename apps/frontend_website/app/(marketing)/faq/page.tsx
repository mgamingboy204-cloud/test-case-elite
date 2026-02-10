"use client";

import { useState } from "react";

const faqs = [
  {
    q: "What is Elite Match?",
    a: "Elite Match is a premium dating platform designed for verified, quality singles who are serious about finding meaningful relationships.",
  },
  {
    q: "How does video verification work?",
    a: "After signing up, you'll schedule a brief video call with our verification team. They'll confirm your identity matches your profile in under 5 minutes.",
  },
  {
    q: "How much does it cost?",
    a: "Elite Match offers a premium membership plan. Pricing varies by region. You can view current plans during the onboarding process.",
  },
  {
    q: "Is my data secure?",
    a: "Absolutely. We use industry-standard encryption, don't sell your data, and give you full control over your privacy settings.",
  },
  {
    q: "Can I get a refund?",
    a: "Yes, refund eligibility is determined based on our refund policy. You can request a refund through your account settings.",
  },
  {
    q: "How do I report someone?",
    a: "You can report a user directly from their profile or through the Report page in your account. Our safety team reviews every report.",
  },
  {
    q: "Can I use Elite Match for friendships?",
    a: "Yes! You can set your intent to 'Friends' in the Discover filters to find platonic connections.",
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 style={{ marginBottom: 12 }}>Frequently Asked Questions</h1>
      <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 40 }}>
        Everything you need to know about Elite Match.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {faqs.map((faq, i) => (
          <div
            key={i}
            style={{
              borderBottom: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 0",
                fontSize: 16,
                fontWeight: 500,
                color: "var(--text)",
                textAlign: "left",
              }}
              aria-expanded={open === i}
            >
              {faq.q}
              <span
                style={{
                  fontSize: 20,
                  color: "var(--muted)",
                  transform: open === i ? "rotate(45deg)" : "rotate(0deg)",
                  transition: "transform 200ms ease",
                  flexShrink: 0,
                  marginLeft: 16,
                }}
              >
                +
              </span>
            </button>
            {open === i && (
              <div
                className="fade-in"
                style={{
                  paddingBottom: 20,
                  color: "var(--muted)",
                  fontSize: 15,
                  lineHeight: 1.6,
                }}
              >
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
