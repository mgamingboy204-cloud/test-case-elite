"use client";

import MarketingShell from "../components/MarketingShell";
import PageHeader from "../components/ui/PageHeader";

export default function LearnPage() {
  return (
    <MarketingShell>
      <section className="marketing-page">
        <PageHeader
          title="Learn the ELITE MATCH experience"
          subtitle="Discover how curated introductions, verification, and intent settings work together."
          variant="marketing"
        />
        <div className="marketing-page__content">
          <div className="ui-card">
            <h3>Curated introductions</h3>
            <p className="text-muted">
              Our match engine blends your preferences with manual curation to surface introductions that feel
              intentional.
            </p>
            <ul>
              <li>Thoughtful introductions instead of endless swiping.</li>
              <li>Intent tags that highlight what you are looking for.</li>
              <li>Profile insights that keep conversations grounded.</li>
            </ul>
          </div>
          <div className="ui-card ui-card--muted">
            <h3>Member journey</h3>
            <p className="text-muted">From onboarding to matches, every step is guided.</p>
            <ul>
              <li>Complete profile setup with clear prompts.</li>
              <li>Verify identity for a trusted community.</li>
              <li>Unlock premium features after approval.</li>
            </ul>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
