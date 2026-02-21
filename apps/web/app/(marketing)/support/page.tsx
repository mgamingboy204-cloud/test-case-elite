"use client";

import Link from "next/link";
import { Card } from "@/app/components/ui/Card";
import { MarketingContentPage } from "@/app/components/MarketingContentPage";

const helpTopics = [
  { title: "Account & Login", desc: "Password reset, phone number changes, account recovery", href: "/faq" },
  { title: "Verification", desc: "Video verification process, status, and troubleshooting", href: "/faq" },
  { title: "Billing & Refunds", desc: "Payment issues, subscription management, refund requests", href: "/faq" },
  { title: "Safety & Reporting", desc: "Report users, block accounts, safety concerns", href: "/safety" },
  { title: "Matching & Discovery", desc: "How matching works, filters, preferences", href: "/learn" },
  { title: "Privacy", desc: "Data handling, privacy settings, account deletion", href: "/privacy" }
];

export default function SupportPage() {
  return (
    <MarketingContentPage title="Support Center" subtitle="Need help? Browse our help topics or reach out directly.">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 34 }}>
        {helpTopics.map((topic) => (
          <Link key={topic.title} href={topic.href}>
            <Card className="marketing-panel marketing-interactive" style={{ padding: 24, minHeight: 170 }}>
              <h4 style={{ marginBottom: 8 }}>{topic.title}</h4>
              <p className="marketing-kicker">{topic.desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="marketing-panel" style={{ padding: 30, textAlign: "center" }}>
        <h3 style={{ marginBottom: 10 }}>Still need help?</h3>
        <p className="marketing-kicker" style={{ marginBottom: 20 }}>
          Our support team is available Monday - Friday, 9am - 6pm.
        </p>
        <Link href="/contact" style={{ minHeight: 44, borderRadius: 999, padding: "12px 24px", background: "linear-gradient(125deg, #f7d4c4, #d89d8f 45%, #9a5f60)", color: "#130d11", display: "inline-flex", alignItems: "center", fontWeight: 700, transition: "transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out" }}>
          Contact Us
        </Link>
      </div>
    </MarketingContentPage>
  );
}
