"use client";

import MarketingShell from "../components/MarketingShell";
import PageHeader from "../components/ui/PageHeader";

export default function SupportPage() {
  return (
    <MarketingShell>
      <section className="marketing-page">
        <PageHeader
          title="Support that listens"
          subtitle="Our concierge team responds quickly and keeps your journey moving."
          variant="marketing"
        />
        <div className="marketing-page__content">
          <div className="ui-card">
            <h3>Concierge help</h3>
            <p className="text-muted">
              Reach out for onboarding, verification, or account assistance.
            </p>
            <ul>
              <li>Fast responses within one business day.</li>
              <li>Dedicated support for verification questions.</li>
              <li>Guidance for profile optimization.</li>
            </ul>
          </div>
          <div className="ui-card ui-card--muted">
            <h3>Self-serve resources</h3>
            <p className="text-muted">Quick answers and helpful walkthroughs.</p>
            <ul>
              <li>Browse the FAQ for common questions.</li>
              <li>Review our safety and privacy commitments.</li>
              <li>Access troubleshooting steps for login and onboarding.</li>
            </ul>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
