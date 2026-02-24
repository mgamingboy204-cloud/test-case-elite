"use client";

import { useState } from "react";
import { MarketingContentPage } from "@/app/components/MarketingContentPage";

const faqs = [
  { q: "What is Elite Match?", a: "Elite Match is a premium dating platform designed for verified, quality singles who are serious about finding meaningful relationships." },
  { q: "How does video verification work?", a: "After signing up, you'll schedule a brief video call with our verification team. They'll confirm your identity matches your profile in under 5 minutes." },
  { q: "How much does it cost?", a: "Elite Match offers a premium membership plan. Pricing varies by region. You can view current plans during onboarding." },
  { q: "Is my data secure?", a: "Absolutely. We use industry-standard encryption, don't sell your data, and give you full control over your privacy settings." },
  { q: "Can I get a refund?", a: "Yes, refund eligibility is determined based on our refund policy. You can request a refund through your account settings." },
  { q: "How do I report someone?", a: "You can report a user directly from their profile or through the Report page in your account. Our safety team reviews every report." }
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <MarketingContentPage title="Frequently Asked Questions" subtitle="Everything you need to know about Elite Match.">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {faqs.map((faq, i) => (
          <div key={faq.q} className="marketing-panel" style={{ padding: "6px 20px" }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{ width: "100%", minHeight: 44, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", fontSize: 17, fontWeight: 600, textAlign: "left" }}
              aria-expanded={open === i}
            >
              {faq.q}
              <span style={{ fontSize: 22, color: "var(--marketing-text-muted)", marginLeft: 12 }}>{open === i ? "−" : "+"}</span>
            </button>
            {open === i ? <p className="marketing-kicker" style={{ paddingBottom: 16 }}>{faq.a}</p> : null}
          </div>
        ))}
      </div>
    </MarketingContentPage>
  );
}
