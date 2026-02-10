"use client";

import Link from "next/link";
import { Card } from "@/app/components/ui/Card";

const helpTopics = [
  { title: "Account & Login", desc: "Password reset, phone number changes, account recovery", href: "/faq" },
  { title: "Verification", desc: "Video verification process, status, and troubleshooting", href: "/faq" },
  { title: "Billing & Refunds", desc: "Payment issues, subscription management, refund requests", href: "/faq" },
  { title: "Safety & Reporting", desc: "Report users, block accounts, safety concerns", href: "/safety" },
  { title: "Matching & Discovery", desc: "How matching works, filters, preferences", href: "/learn" },
  { title: "Privacy", desc: "Data handling, privacy settings, account deletion", href: "/privacy" },
];

export default function SupportPage() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
      <h1 style={{ marginBottom: 12 }}>Support Center</h1>
      <p style={{ color: "var(--muted)", fontSize: 17, lineHeight: 1.6, marginBottom: 40 }}>
        Need help? Browse our help topics or reach out directly.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
          marginBottom: 48,
        }}
      >
        {helpTopics.map((t) => (
          <Link key={t.title} href={t.href}>
            <Card
              style={{
                padding: 24,
                cursor: "pointer",
                height: "100%",
              }}
            >
              <h4 style={{ marginBottom: 6 }}>{t.title}</h4>
              <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.5, margin: 0 }}>
                {t.desc}
              </p>
            </Card>
          </Link>
        ))}
      </div>

      <Card style={{ padding: 32, textAlign: "center" }}>
        <h3 style={{ marginBottom: 8 }}>Still need help?</h3>
        <p style={{ color: "var(--muted)", fontSize: 15, marginBottom: 20 }}>
          Our support team is available Monday - Friday, 9am - 6pm.
        </p>
        <Link href="/contact">
          <button
            style={{
              padding: "10px 24px",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: "var(--radius-full)",
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Contact Us
          </button>
        </Link>
      </Card>
    </div>
  );
}
