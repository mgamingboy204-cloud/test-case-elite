"use client";

import { Card } from "@/app/components/ui/Card";
import { PageHeader } from "@/app/components/ui/PageHeader";



export default function AdminMatchesPage() {
  return (
    <div>
      <PageHeader title="Matches" subtitle="Match management and analytics" />

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "64px 24px",
            textAlign: "center",
          }}
        >
          {/* Decorative icon area */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "var(--radius-xl)",
              background: "var(--primary-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>

          <h2
            style={{
              margin: "0 0 8px",
              fontSize: 22,
              fontWeight: 700,
              background: "linear-gradient(135deg, var(--primary), var(--danger))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Coming Soon
          </h2>

          <p
            style={{
              margin: "0 0 24px",
              color: "var(--muted)",
              fontSize: 15,
              maxWidth: 360,
              lineHeight: 1.6,
            }}
          >
            Match analytics, manual match management, and compatibility insights are
            currently in development.
          </p>

          {/* Feature preview cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 12,
              width: "100%",
              maxWidth: 500,
            }}
          >
            {[
              { title: "Match Analytics", desc: "Track match rates and trends" },
              { title: "Manual Matching", desc: "Curate matches for premium users" },
              { title: "Compatibility", desc: "AI-powered compatibility scores" },
            ].map((feature) => (
              <div
                key={feature.title}
                style={{
                  background: "var(--bg)",
                  padding: 16,
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                }}
              >
                <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600 }}>
                  {feature.title}
                </p>
                <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
